// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { RegeneratorRules } from "./RegeneratorRules.sol";
import { Validator, UserValidation, ResourceValidation, Pool, ContractsDependency } from "./types/ValidatorTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { Callable } from "./Callable.sol";
import { ValidatorPool } from "./ValidatorPool.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Report } from "./types/DeveloperTypes.sol";
import { Work } from "./types/ResearcherTypes.sol";

/**
 * @author Sintrop
 * @title ValidatorRules
 * @dev Manage validators rules and data
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions
 */
contract ValidatorRules is Callable {
  mapping(address => Validator) private validators;
  mapping(address => UserValidation[]) private userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public reportValidations;
  mapping(uint256 => ResourceValidation[]) public workValidations;
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorWorksValidations;
  mapping(address => mapping(address => bool)) private validatorUsersValidations;

  UserContract private userContract;
  RegeneratorRules private regeneratorContract;
  ValidatorPool private validatorPool;
  InspectorRules private inspectorContract;
  DeveloperRules private developerContract;
  ResearcherRules private researcherContract;
  ContributorRules private contributorContract;
  ActivistRules private activistContract;

  address[] public validatorsAddress;
  UserType private constant USER_TYPE = UserType.VALIDATOR;
  uint256 private immutable firstValidatorLimit;
  uint256 private immutable secondValidatorLimit;

  constructor(uint256 firstValidatorLimit_, uint256 secondValidatorLimit_) {
    firstValidatorLimit = firstValidatorLimit_;
    secondValidatorLimit = secondValidatorLimit_;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    userContract = UserContract(contractDependency.userContractAddress);
    regeneratorContract = RegeneratorRules(contractDependency.regeneratorContractAddress);
    validatorPool = ValidatorPool(contractDependency.validatorPoolAddress);
    inspectorContract = InspectorRules(contractDependency.inspectorContractAddress);
    developerContract = DeveloperRules(contractDependency.developerContractAddress);
    researcherContract = ResearcherRules(contractDependency.researcherContractAddress);
    contributorContract = ContributorRules(contractDependency.contributorContractAddress);
    activistContract = ActivistRules(contractDependency.activistContractAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a validator
   */
  function addValidator() public {
    validators[msg.sender] = Validator(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      Pool(0, validatorPoolEra())
    );

    validatorsAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);
  }

  function addUserValidation(
    address userAddress,
    string memory justification
  ) public canAddValidationModifier(msg.sender) {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    require(!userContract.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!userContract.userTypeIs(UserType.DENIED, userAddress), "User already denied");
    require(!validatorUsersValidations[msg.sender][userAddress], "Already voted");

    validatorUsersValidations[msg.sender][userAddress] = true;

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
  ) public mustBeAllowedCaller canAddValidationModifier(validatorAddress) {
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

  function addDeveloperReportValidation(
    Report memory report,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller canAddValidationModifier(validatorAddress) {
    require(!validatorReportsValidations[validatorAddress][report.id], "Already voted");

    validatorReportsValidations[validatorAddress][report.id] = true;

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();

    bool addPenalty = report.validationsCount >= majorityValidatorsCount_;

    reportValidations[report.id].push(
      ResourceValidation(validatorAddress, report.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 developerTotalPenalties = developerContract.addPenalty(report.developer, report.id);
    removeDeveloperReport(report);

    if (developerTotalPenalties >= developerContract.MAX_PENALTIES()) externalDenieUser(report.developer);
  }

  function addResearcheWorkValidation(
    Work memory work,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller canAddValidationModifier(validatorAddress) {
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

  function removeDeveloperReport(Report memory report) internal {
    removeLevelsFromPool(report.developer, 1);
  }

  function removeReseacherWork(Work memory work) internal {
    removeLevelsFromPool(work.createdBy, 1);
  }

  function removeUserInspection(Inspection memory inspection) internal {
    inspectorContract.decrementInspections(inspection.inspector);
    regeneratorContract.decrementInspections(inspection.regenerator);

    removeLevelsFromPool(inspection.inspector, 1);

    if (inspection.regenerationScore < 0)
      return regeneratorContract.removeNegativeScore(inspection.regenerator, -(inspection.regenerationScore));

    removeLevelsFromPool(inspection.regenerator, uint256(inspection.regenerationScore));
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
    if (oldUserType == UserType.REGENERATOR) return regeneratorContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistContract.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.VALIDATOR) return validatorRemovePoolLevels(userAddress, levels);
  }

  function getUserValidations(address userAddress) public view returns (UserValidation[] memory) {
    return userValidations[userAddress];
  }

  function getValidator(address addr) public view returns (Validator memory) {
    return validators[addr];
  }

  function majorityValidatorsCount() public view returns (uint256) {
    uint256 currentEra = validatorPoolEra();

    if (currentEra == 1) {
      uint256 _validatorsCount = userContract.userTypesCount(USER_TYPE);
      return _validatorsCount / 2;
    } else {
      uint256 levels = validatorPool.getEra(currentEra - 1).levels;

      return levels / 2;
    }
  }

  function declareAlive() public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    address addr = msg.sender;
    uint256 levels = validatorPool.eraLevels(validatorPoolEra(), addr);

    require(levels == 0, "Only once per era");

    Validator memory validator = validators[addr];
    validator.pool.level++;
    validators[addr] = validator;

    validatorPool.addLevel(addr, validator.pool.level, 1);
  }

  /**
   * @dev Call withdraw function from validatorPool to try to claim tokens
   * @notice Withdraw regeneration credit from validation service provided
   */
  function withdraw() public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Pool only to validators");

    Validator memory validator = validators[msg.sender];
    uint256 currentEra = validator.pool.currentEra;

    require(validatorPool.canWithdraw(currentEra), "Can't approve withdraw");

    validators[msg.sender].pool.currentEra++;

    validatorPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Remove pool levels from validator
   * @param addr Validator wallet
   * @param removeSomeLevels Levels to remove
   */
  function validatorRemovePoolLevels(address addr, uint256 removeSomeLevels) private {
    Validator memory validator = validators[addr];

    validators[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : validator.pool.level;
    validatorPool.removePoolLevels(addr, validatorPoolEra(), removeSomeLevels);
  }

  /**
   * @dev Current validatorPool era
   * @return uint256 Return the current contract pool era
   */
  function validatorPoolEra() private view returns (uint256) {
    return validatorPool.currentContractEra();
  }

  modifier canAddValidationModifier(address validatorAddress) {
    uint256 validatorAlive = validatorPool.eraLevels(validatorPoolEra() - 1, validatorAddress);

    require(validatorPoolEra() == 1 || validatorAlive >= 1, "You did not contribute in the last era");
    _;
  }
}
