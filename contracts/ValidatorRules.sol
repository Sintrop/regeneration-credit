// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { RegeneratorRules } from "./RegeneratorRules.sol";
import { Validator, UserValidation, ResourceValidation, Pool, ContractsDependency } from "./types/ValidatorTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { ValidatorPool } from "./ValidatorPool.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Report } from "./types/DeveloperTypes.sol";
import { Research } from "./types/ResearcherTypes.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @author Sintrop
 * @title ValidatorRules
 * @dev Manage validators rules and data
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions
 */
contract ValidatorRules is Callable, Invitable {
  mapping(address => Validator) private validators;
  mapping(address => UserValidation[]) private userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public reportValidations;
  mapping(uint256 => ResourceValidation[]) public researchValidations;
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorResearchesValidations;
  mapping(address => mapping(address => bool)) private validatorUsersValidations;
  mapping(uint256 => address) public validatorsAddress;

  UserRules private userRules;
  RegeneratorRules private regeneratorRules;
  ValidatorPool private validatorPool;
  InspectorRules private inspectorRules;
  DeveloperRules private developerRules;
  ResearcherRules private researcherRules;
  ContributorRules private contributorRules;
  ActivistRules private activistRules;

  UserType private constant USER_TYPE = UserType.VALIDATOR;
  uint256 private immutable firstValidatorLimit;
  uint256 private immutable secondValidatorLimit;
  uint256 internal totalDeclaredAlives;

  constructor(uint256 firstValidatorLimit_, uint256 secondValidatorLimit_) {
    firstValidatorLimit = firstValidatorLimit_;
    secondValidatorLimit = secondValidatorLimit_;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    userRules = UserRules(contractDependency.userRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    validatorPool = ValidatorPool(contractDependency.validatorPoolAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = DeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = ResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = ContributorRules(contractDependency.contributorRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a validator
   */
  function addValidator() public {
    uint256 id = userRules.userTypesCount(USER_TYPE) + 1;

    validators[msg.sender] = Validator(id, msg.sender, Pool(0, validatorPoolEra()), block.number);

    validatorsAddress[id] = msg.sender;
    userRules.addUser(msg.sender, USER_TYPE);
  }

  function canSendInvite(address addr) public view returns (bool) {
    Validator memory validator = validators[addr];

    if (validator.id <= 0) return false;

    return canInvite(totalDeclaredAlives, userRules.userTypesTotalCount(USER_TYPE), validator.pool.level);
  }

  function addUserValidation(
    address userAddress,
    string memory justification
  ) public canAddValidationModifier(msg.sender) {
    require(userRules.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    require(!userRules.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!userRules.userTypeIs(UserType.DENIED, userAddress), "User already denied");
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

    uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);
    removeUserInspection(inspection);

    if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) externalDenieUser(inspection.inspector);
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

    uint256 developerTotalPenalties = developerRules.addPenalty(report.developer, report.id);
    removeDeveloperReport(report);

    if (developerTotalPenalties >= developerRules.MAX_PENALTIES()) externalDenieUser(report.developer);
  }

  function addResearcherResearchValidation(
    Research memory research,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller canAddValidationModifier(validatorAddress) {
    require(!validatorResearchesValidations[validatorAddress][research.id], "Already voted");

    validatorResearchesValidations[validatorAddress][research.id] = true;

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();

    bool addPenalty = research.validationsCount >= majorityValidatorsCount_;

    researchValidations[research.id].push(
      ResourceValidation(validatorAddress, research.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 totalPenalties = researcherRules.addPenalty(research.createdBy, research.id);
    removeReseacherResearch(research);

    if (totalPenalties >= researcherRules.MAX_PENALTIES()) externalDenieUser(research.createdBy);
  }

  function removeDeveloperReport(Report memory report) internal {
    removeLevelsFromPool(report.developer, 1);
  }

  function removeReseacherResearch(Research memory research) internal {
    removeLevelsFromPool(research.createdBy, 1);
  }

  function removeUserInspection(Inspection memory inspection) internal {
    inspectorRules.decrementInspections(inspection.inspector);
    regeneratorRules.decrementInspections(inspection.regenerator);

    removeLevelsFromPool(inspection.inspector, 1);
    removeLevelsFromPool(inspection.regenerator, inspection.regenerationScore);
  }

  function externalDenieUser(address userAddress) private {
    denieUser(userAddress);
  }

  function denieUser(address userAddress) internal {
    removeLevelsFromPool(userAddress, 0);
    userRules.setDeniedType(userAddress);
  }

  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = userRules.getUser(userAddress);

    if (oldUserType == UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress, levels);
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
      uint256 _validatorsCount = userRules.userTypesCount(USER_TYPE);
      return _validatorsCount / 2;
    } else {
      uint256 levels = validatorPool.getEra(currentEra - 1).levels;

      return levels / 2;
    }
  }

  function declareAlive() public {
    require(userRules.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    address addr = msg.sender;
    uint256 levels = validatorPool.eraLevels(validatorPoolEra(), addr);

    require(levels == 0, "Only once per era");

    totalDeclaredAlives++;

    Validator memory validator = validators[addr];
    validator.pool.level++;
    validators[addr] = validator;

    validatorPool.addLevel(addr, 1);
  }

  /**
   * @dev Call withdraw function from validatorPool to try to claim tokens
   * @notice Withdraw regeneration credit from validation service provided
   */
  function withdraw() public {
    require(userRules.userTypeIs(UserType.VALIDATOR, msg.sender), "Pool only to validators");

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
