// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { ProducerContract } from "./ProducerContract.sol";
import { Validator, UserValidation, ResourceValidation, Pool, ContractsDependency } from "./types/ValidatorTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { Callable } from "./Callable.sol";
import { ValidatorPool } from "./ValidatorPool.sol";
import { InspectorContract } from "./InspectorContract.sol";
import { DeveloperContract } from "./DeveloperContract.sol";
import { ResearcherContract } from "./ResearcherContract.sol";
import { ContributorContract } from "./ContributorContract.sol";
import { ActivistContract } from "./ActivistContract.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Contribution } from "./types/DeveloperTypes.sol";
import { Work } from "./types/ResearcherTypes.sol";

/**
 * @author Sintrop
 * @title ValidatorContract
 * @dev Manage validators rules and data
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions
 */
contract ValidatorContract is Callable {
  mapping(address => Validator) private validators;
  mapping(address => UserValidation[]) private userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public contributionValidations;
  mapping(uint256 => ResourceValidation[]) public workValidations;
  mapping(address => mapping(uint256 => bool)) private validatorContributionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorWorksValidations;

  UserContract private userContract;
  ProducerContract private producerContract;
  ValidatorPool private validatorPool;
  InspectorContract private inspectorContract;
  DeveloperContract private developerContract;
  ResearcherContract private researcherContract;
  ContributorContract private contributorContract;
  ActivistContract private activistContract;

  address[] private validatorsAddress;
  UserType private constant USER_TYPE = UserType.VALIDATOR;
  uint256 private immutable firstValidatorLimit;
  uint256 private immutable secondValidatorLimit;

  constructor(uint256 firstValidatorLimit_, uint256 secondValidatorLimit_) {
    firstValidatorLimit = firstValidatorLimit_;
    secondValidatorLimit = secondValidatorLimit_;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    userContract = UserContract(contractDependency.userContractAddress);
    producerContract = ProducerContract(contractDependency.producerContractAddress);
    validatorPool = ValidatorPool(contractDependency.validatorPoolAddress);
    inspectorContract = InspectorContract(contractDependency.inspectorContractAddress);
    developerContract = DeveloperContract(contractDependency.developerContractAddress);
    researcherContract = ResearcherContract(contractDependency.researcherContractAddress);
    contributorContract = ContributorContract(contractDependency.contributorContractAddress);
    activistContract = ActivistContract(contractDependency.activistContractAddress);
  }

  function addValidator() public {
    validators[msg.sender] = Validator(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      Pool(0, validatorPoolEra())
    );

    validatorsAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);
  }

  function addUserValidation(address userAddress, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    require(!userContract.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!userContract.userTypeIs(UserType.DENIED, userAddress), "User already denied");

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();
    uint256 validationsCount = userValidations[userAddress].length + 1;

    userValidations[userAddress].push(
      UserValidation(msg.sender, userAddress, justification, majorityValidatorsCount_, block.number)
    );

    if (validationsCount >= majorityValidatorsCount_) denieUser(userAddress);
  }

  function addInspectionValidation(
    Inspection memory inspection,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorInspectionsValidations[validatorAddress][inspection.id], "Already voted");

    validatorInspectionsValidations[validatorAddress][inspection.id] = true;

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();

    bool addPenalty = inspection.validationsCount >= majorityValidatorsCount_;

    inspectionValidations[inspection.id].push(
      ResourceValidation(validatorAddress, inspection.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorContract.addPenalty(inspection.inspector, inspection.id);
    removeUserInspection(inspection);

    if (inspectorTotalPenalties >= inspectorContract.maxPenalties()) externalDenieUser(inspection.inspector);
  }

  function addDeveloperContributionValidation(
    Contribution memory contribution,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorContributionsValidations[validatorAddress][contribution.id], "Already voted");

    validatorContributionsValidations[validatorAddress][contribution.id] = true;

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();

    bool addPenalty = contribution.validationsCount >= majorityValidatorsCount_;

    contributionValidations[contribution.id].push(
      ResourceValidation(validatorAddress, contribution.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 developerTotalPenalties = developerContract.addPenalty(contribution.developer, contribution.id);
    removeDeveloperContribution(contribution);

    if (developerTotalPenalties >= developerContract.MAX_PENALTIES()) externalDenieUser(contribution.developer);
  }

  function addResearcheWorkValidation(
    Work memory work,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorWorksValidations[validatorAddress][work.id], "Already voted");

    validatorWorksValidations[validatorAddress][work.id] = true;

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();

    bool addPenalty = work.validationsCount >= majorityValidatorsCount_;

    workValidations[work.id].push(
      ResourceValidation(validatorAddress, work.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 totalPenalties = researcherContract.addPenalty(work.createdBy, work.id);
    removeReseacherWork(work);

    if (totalPenalties >= researcherContract.MAX_PENALTIES()) externalDenieUser(work.createdBy);
  }

  function removeDeveloperContribution(Contribution memory contribution) internal {
    removeLevelsFromPool(contribution.developer, 1);
  }

  function removeReseacherWork(Work memory work) internal {
    removeLevelsFromPool(work.createdBy, 1);
  }

  function removeUserInspection(Inspection memory inspection) internal {
    inspectorContract.decrementInspections(inspection.inspector);
    producerContract.decrementInspections(inspection.producer);

    removeLevelsFromPool(inspection.inspector, 1);

    if (inspection.isaScore < 0)
      return producerContract.removeNegativeScore(inspection.producer, -(inspection.isaScore));

    removeLevelsFromPool(inspection.producer, uint256(inspection.isaScore));
  }

  function externalDenieUser(address userAddress) private {
    denieUser(userAddress);
  }

  function denieUser(address userAddress) internal {
    removeLevelsFromPool(userAddress, 0);

    userContract.setDeniedType(userAddress);
  }

  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = userContract.getUser(userAddress);

    if (oldUserType == UserType.INSPECTOR) return inspectorContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.PRODUCER) return producerContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.VALIDATOR) return validatorRemovePoolLevels(userAddress, levels);
  }

  function getUserValidations(address userAddress) public view returns (UserValidation[] memory) {
    return userValidations[userAddress];
  }

  function getInspectionValidations(uint256 inspectionId) public view returns (ResourceValidation[] memory) {
    return inspectionValidations[inspectionId];
  }

  function getWorkValidations(uint256 workId) public view returns (ResourceValidation[] memory) {
    return workValidations[workId];
  }

  function getContributionValidations(uint256 contributionId) public view returns (ResourceValidation[] memory) {
    return contributionValidations[contributionId];
  }

  function getValidators() public view returns (Validator[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Validator[] memory validatorList = new Validator[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = validatorsAddress[i];
      validatorList[i] = validators[acAddress];
    }

    return validatorList;
  }

  function getValidator(address addr) public view returns (Validator memory) {
    return validators[addr];
  }

  function majorityValidatorsCount() public view returns (uint256) {
    uint256 _validatorsCount = userContract.userTypesCount(USER_TYPE);

    if (_validatorsCount <= firstValidatorLimit) return _validatorsCount / 2;
    if (_validatorsCount <= secondValidatorLimit) return _validatorsCount / 4;

    return _validatorsCount / 8;
  }

  function addLevel() public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    address addr = msg.sender;
    uint256 levels = validatorPool.eraLevels(validatorPoolEra(), addr);

    require(levels == 0, "Only once per era");

    Validator memory validator = validators[addr];
    validator.pool.level++;
    validators[addr] = validator;

    validatorPool.addLevel(addr, validator.pool.level, 1);
  }

  function withdraw() public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Pool only to validators");

    Validator memory validator = validators[msg.sender];
    uint256 currentEra = validator.pool.currentEra;

    require(validatorPool.canWithdraw(currentEra), "Can't approve withdraw");

    validators[msg.sender].pool.currentEra++;

    validatorPool.withdraw(msg.sender, currentEra);
  }

  function validatorRemovePoolLevels(address addr, uint256 removeSomeLevels) private {
    Validator memory validator = validators[addr];

    validators[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : validator.pool.level;
    validatorPool.removePoolLevels(addr, validatorPoolEra(), removeSomeLevels);
  }

  function validatorPoolEra() private view returns (uint256) {
    return validatorPool.currentContractEra();
  }
}
