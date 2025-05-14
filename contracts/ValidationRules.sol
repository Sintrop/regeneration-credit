// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { RegeneratorRules } from "./RegeneratorRules.sol";
import { UserValidation, ResourceValidation, ContractsDependency } from "./types/ValidationTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Report } from "./types/DeveloperTypes.sol";
import { Research } from "./types/ResearcherTypes.sol";
import { Contribution } from "./types/ContributorTypes.sol";
import { VoteRules } from "./VoteRules.sol";

/**
 * @author Sintrop
 * @title ValidationRules
 * @dev Manage validators rules and data
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions
 */
contract ValidationRules is Callable {
  mapping(address => mapping(uint256 => UserValidation[])) public userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public reportValidations;
  mapping(uint256 => ResourceValidation[]) public contributionValidations;
  mapping(uint256 => ResourceValidation[]) public researchValidations;
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorContributionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorResearchesValidations;
  mapping(address => mapping(address => mapping(uint256 => bool))) private validatorUsersValidations;
  mapping(address => uint256) public validatorLastVoteAt;

  CommunityRules private communityRules;
  RegeneratorRules private regeneratorRules;
  InspectorRules private inspectorRules;
  DeveloperRules private developerRules;
  ResearcherRules private researcherRules;
  ContributorRules private contributorRules;
  ActivistRules private activistRules;

  /// @notice VoteRules contract address
  VoteRules internal voteRules;

  uint256 private immutable timeBetweenVotes;

  constructor(uint256 timeBetweenVotes_) {
    timeBetweenVotes = timeBetweenVotes_;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = DeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = ResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = ContributorRules(contractDependency.contributorRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev Allows users to attempt to vote to invalidate an user
   * @notice Vote to invalidate users with unwanted behavior
   *
   * Requirements:
   *
   * - the caller must be a voter user
   * - caller level must be above average
   * - caller must have waited timeBetweenVotes
   * - caller must vote only once per user
   *
   * @param userAddress Invalidation user address
   * @param justification Invalidation justification
   */
  function addUserValidation(address userAddress, string memory justification) public {
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(!communityRules.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!communityRules.userTypeIs(UserType.DENIED, userAddress), "User already denied");

    uint256 currentEra = userCurrentEra(userAddress);

    require(!validatorUsersValidations[msg.sender][userAddress][currentEra], "Already voted");
    require(waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    validatorUsersValidations[msg.sender][userAddress][currentEra] = true;
    validatorLastVoteAt[msg.sender] = block.number;

    uint256 _votesToInvalidate = votesToInvalidate();
    uint256 validationsCount = userValidations[userAddress][currentEra].length + 1;

    userValidations[userAddress][currentEra].push(
      UserValidation(msg.sender, userAddress, justification, _votesToInvalidate, block.number)
    );

    if (validationsCount >= _votesToInvalidate) denieUser(userAddress);
  }

  function userCurrentEra(address userAddress) internal view returns (uint256 era) {
    UserType userType = communityRules.getUser(userAddress);

    if (userType == UserType.ACTIVIST) return activistRules.poolCurrentEra();
    if (userType == UserType.CONTRIBUTOR) return contributorRules.poolCurrentEra();
    if (userType == UserType.DEVELOPER) return developerRules.poolCurrentEra();
    if (userType == UserType.INSPECTOR) return inspectorRules.poolCurrentEra();
    if (userType == UserType.RESEARCHER) return researcherRules.poolCurrentEra();
    if (userType == UserType.REGENERATOR) return regeneratorRules.poolCurrentEra();
  }

  /**
   * @dev Called only by the inspectionRules contract
   * @notice Allows users to attempt to vote to invalidate an inspection
   *
   * Requirements:
   *
   * - voter must vote only once per user
   *
   * @param inspection Inspection data
   * @param justification Invalidation justification
   * @param validatorAddress Address of the voter
   */
  function addInspectionValidation(
    Inspection memory inspection,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorInspectionsValidations[validatorAddress][inspection.id], "Already voted");

    validatorInspectionsValidations[validatorAddress][inspection.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 majorityValidatorsCount_ = votesToInvalidate();

    bool addPenalty = inspection.validationsCount >= majorityValidatorsCount_;

    inspectionValidations[inspection.id].push(
      ResourceValidation(validatorAddress, inspection.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);
    removeUserInspection(inspection);

    if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) externalDenieUser(inspection.inspector);
  }

  /**
   * @dev Called only by the developerRules contract
   * @notice Allows users to attempt to vote to invalidate a report
   *
   * Requirements:
   *
   * - voter must vote only once per report
   *
   * @param report Report data
   * @param justification Invalidation justification
   * @param validatorAddress Address of the voter
   */
  function addDeveloperReportValidation(
    Report memory report,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorReportsValidations[validatorAddress][report.id], "Already voted");

    validatorReportsValidations[validatorAddress][report.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    reportValidations[report.id].push(
      ResourceValidation(validatorAddress, report.id, justification, votesToInvalidate(), block.number)
    );

    if (report.valid) return;

    uint256 developerTotalPenalties = developerRules.addPenalty(report.developer, report.id);

    removeDeveloperReport(report);

    if (developerTotalPenalties >= developerRules.MAX_PENALTIES()) externalDenieUser(report.developer);
  }

  /**
   * @dev Called only by the contributorRules contract
   * @notice Allows users to attempt to vote to invalidate a contribution
   *
   * Requirements:
   *
   * - voter must vote only once per resource
   *
   * @param contribution Contribution data
   * @param justification Invalidation justification
   * @param validatorAddress Address of the voter
   */
  function addContributionValidation(
    Contribution memory contribution,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorContributionsValidations[validatorAddress][contribution.id], "Already voted");

    validatorContributionsValidations[validatorAddress][contribution.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    contributionValidations[contribution.id].push(
      ResourceValidation(validatorAddress, contribution.id, justification, votesToInvalidate(), block.number)
    );

    if (contribution.valid) return;

    uint256 contributorTotalPenalties = contributorRules.addPenalty(contribution.user, contribution.id);

    removeContributorContribution(contribution);

    if (contributorTotalPenalties >= contributorRules.MAX_PENALTIES()) externalDenieUser(contribution.user);
  }

  /**
   * @dev Called only by the researcherRules contract
   * @notice Allows users to attempt to vote to invalidate a research
   *
   * Requirements:
   *
   * - voter must vote only once per resource
   *
   * @param research Research data
   * @param justification Invalidation justification
   * @param validatorAddress Address of the voter
   */
  function addResearcherResearchValidation(
    Research memory research,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorResearchesValidations[validatorAddress][research.id], "Already voted");

    validatorResearchesValidations[validatorAddress][research.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 majorityValidatorsCount_ = votesToInvalidate();

    bool addPenalty = research.validationsCount >= majorityValidatorsCount_;

    researchValidations[research.id].push(
      ResourceValidation(validatorAddress, research.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 totalPenalties = researcherRules.addPenalty(research.createdBy, research.id);
    removeReseacherResearch(research);

    if (totalPenalties >= researcherRules.MAX_PENALTIES()) externalDenieUser(research.createdBy);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool
   * @param report Invalidated report
   */
  function removeDeveloperReport(Report memory report) internal {
    removeLevelsFromPool(report.developer, 1);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool
   * @param contribution Invalidated contribution
   */
  function removeContributorContribution(Contribution memory contribution) internal {
    removeLevelsFromPool(contribution.user, 1);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool
   * @param research Invalidated research
   */
  function removeReseacherResearch(Research memory research) internal {
    removeLevelsFromPool(research.createdBy, 1);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool
   * @param inspection Invalidated inspection
   */
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
    communityRules.setDeniedType(userAddress);
  }

  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = communityRules.getUser(userAddress);

    if (oldUserType == UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress, levels);
  }

  function getUserValidations(address userAddress, uint256 currentEra) public view returns (UserValidation[] memory) {
    return userValidations[userAddress][currentEra];
  }

  function votesToInvalidate() public view returns (uint256 count) {
    uint256 voters = communityRules.votersCount();

    if (voters <= 50) return 2;
    if (voters > 50 && voters <= 500) return 5;
    if (voters > 500 && voters <= 1000) return 10;
    if (voters > 1000 && voters <= 2000) return 20;
    if (voters > 2000 && voters <= 4000) return 40;
    if (voters > 4000 && voters <= 8000) return 80;
    if (voters > 8000 && voters <= 16000) return 160;
    if (voters > 16000 && voters <= 32000) return 320;
    if (voters > 32000) return 500;
  }

  function waitedTimeBetweenVotes(address validatorAddress) public view returns (bool) {
    uint256 lastVoteAt = validatorLastVoteAt[validatorAddress];

    bool canVote = block.number > lastVoteAt + timeBetweenVotes;
    return canVote || lastVoteAt <= 0;
  }
}
