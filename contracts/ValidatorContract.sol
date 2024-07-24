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
import { Inspection } from "./types/InspectionTypes.sol";
import { Contribution } from "./types/DeveloperTypes.sol";
import { Work } from "./types/ResearcherTypes.sol";

contract ValidatorContract is Callable {
  mapping(address => Validator) internal validators;
  mapping(address => UserValidation[]) private userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public contributionValidations;
  mapping(address => mapping(uint256 => bool)) internal validatorContributionsValidations;
  mapping(address => mapping(uint256 => bool)) internal validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) internal validatorWorksValidations;

  UserContract internal userContract;
  ProducerContract internal producerContract;
  ValidatorPool internal validatorPool;
  InspectorContract internal inspectorContract;
  DeveloperContract internal developerContract;
  ResearcherContract internal researcherContract;
  ContributorContract internal contributorContract;

  address[] internal validatorsAddress;
  uint256 public validatorsCount;
  uint256 internal firstValidatorLimit;
  uint256 internal secondValidatorLimit;

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
  }

  function addValidator() public {
    require(!validatorExists(msg.sender), "This validator already exist");

    uint256 id = validatorsCount + 1;
    UserType userType = UserType.VALIDATOR;
    uint256 currentEra = validatorPoolEra();

    Pool memory pool = Pool(0, currentEra);

    validators[msg.sender] = Validator(id, msg.sender, userType, pool);
    validatorsAddress.push(msg.sender);
    validatorsCount++;
    userContract.addUser(msg.sender, userType);
  }

  function addUserValidation(address userAddress, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
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

    uint256 inspectorTotalPenalties = inspectorContract.addPenalty(inspection.acceptedBy, inspection.id);
    removeUserInspection(inspection);

    if (inspectorTotalPenalties >= inspectorContract.maxPenalties()) externalDenieUser(inspection.acceptedBy);
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

    contributionValidations[work.id].push(
      ResourceValidation(validatorAddress, work.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 totalPenalties = researcherContract.addPenalty(work.createdBy, work.id);
    removeReseacherWork(work);

    if (totalPenalties >= researcherContract.MAX_PENALTIES()) externalDenieUser(work.createdBy);
  }

  function removeDeveloperContribution(Contribution memory contribution) internal {
    externalRemoveLevels(contribution.developer, 1);
  }

  function removeReseacherWork(Work memory work) internal {
    externalRemoveLevels(work.createdBy, 1);
  }

  function removeUserInspection(Inspection memory inspection) internal {
    inspectorContract.decrementInspections(inspection.acceptedBy);
    producerContract.decrementInspections(inspection.createdBy);

    if (inspection.isaScore <= 0) return;

    uint256 levels = uint256(inspection.isaScore);

    externalRemoveLevels(inspection.createdBy, levels);
    externalRemoveLevels(inspection.acceptedBy, 1);
  }

  function externalDenieUser(address userAddress) internal {
    denieUser(userAddress);
  }

  function externalRemoveLevels(address userAddress, uint256 levels) internal {
    removeLevelsFromPool(userAddress, levels);
  }

  function denieUser(address userAddress) internal {
    removeLevelsFromPool(userAddress, 0);

    userContract.setDeniedType(userAddress);
  }

  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = userContract.getUser(userAddress);

    if (oldUserType == UserType.PRODUCER) return producerContract.resetLevels(userAddress, levels);
    if (oldUserType == UserType.INSPECTOR) return inspectorContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerContract.resetLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherContract.resetLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorContract.removePoolLevels(userAddress, levels);
  }

  function getUserValidations(address userAddress) public view returns (UserValidation[] memory) {
    return userValidations[userAddress];
  }

  function getInspectionValidations(uint256 inspectionId) public view returns (ResourceValidation[] memory) {
    return inspectionValidations[inspectionId];
  }

  function getValidators() public view returns (Validator[] memory) {
    Validator[] memory validatorList = new Validator[](validatorsCount);

    for (uint256 i = 0; i < validatorsCount; i++) {
      address acAddress = validatorsAddress[i];
      validatorList[i] = validators[acAddress];
    }

    return validatorList;
  }

  function getValidator(address addr) public view returns (Validator memory) {
    return validators[addr];
  }

  function validatorExists(address addr) public view returns (bool) {
    return validators[addr].id > 0;
  }

  function majorityValidatorsCount() public view returns (uint256) {
    uint256 _validatorsCount = validatorsCount;

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

  function validatorPoolEra() internal view returns (uint256) {
    return validatorPool.currentContractEra();
  }
}
