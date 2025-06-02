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
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol"; // Using SafeMath for safety

/**
 * @author Sintrop
 * @title ValidationRules
 * @dev Manage validators rules and data. This contract is responsible for reviewing and voting to invalidate wrong or corrupted actions across different user types and resources.
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions.
 */
contract ValidationRules is Callable {
  using SafeMath for uint256;

  // --- State Variables ---

  /// @notice The relationship between address and validations received by era
  mapping(address => mapping(uint256 => UserValidation[])) public userValidations;

  /// @notice Relationship between inspection and validations array
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;

  /// @notice Relationship between report and validations array
  mapping(uint256 => ResourceValidation[]) public reportValidations;

  /// @notice Relashionship between contribution and validations array
  mapping(uint256 => ResourceValidation[]) public contributionValidations;

  /// @notice Relationship between research and validations array
  mapping(uint256 => ResourceValidation[]) public researchValidations;

  /// @notice Relationship between validator and report validation. Only one validation per resource allowed
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;

  /// @notice Relationship between validator and contribution validation. Only one validation per resource allowed
  mapping(address => mapping(uint256 => bool)) private validatorContributionsValidations;

  /// @notice Relationship between validator and inspection validation. Only one validation per resource allowed
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;

  /// @notice Relationship between validator and research validation. Only one validation per resource allowed
  mapping(address => mapping(uint256 => bool)) private validatorResearchesValidations;

  /// @notice Relationship between validator and user validation. Only one validation per user per era allowed
  mapping(address => mapping(address => mapping(uint256 => bool))) private validatorUsersValidations;

  /// @notice Relationship between validator and last vote block.number
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

  /// @notice Amount of blocks between votes
  uint256 private immutable timeBetweenVotes;

  /// @notice Flag to ensure contract dependencies are set only once.
  bool public contractsDependenciesSet; // Added flag for one-time initialization

  // --- Events ---

  /**
   * @notice Emitted when a user is successfully invalidated and denied.
   * @param _userAddress The address of the user who was denied.
   */
  event UserDenied(address indexed _userAddress);

  /**
   * @notice Emitted when a resource (Inspection, Report, Contribution, Research) is processed after accumulating enough invalidation votes.
   * @param _resourceType The type of resource being processed (e.g., "Inspection", "Report").
   * @param _resourceId The ID of the resource.
   * @param _ownerAddress The address of the user who created the invalidated resource.
   * @param _penaltiesAdded The number of penalties added to the owner.
   */
  event ResourceInvalidated(
    string _resourceType,
    uint256 _resourceId,
    address indexed _ownerAddress,
    uint256 _penaltiesAdded
  );

  // --- Constructor ---

  /**
   * @notice Initializes the ValidationRules contract with a minimum time between votes.
   * @dev Sets the immutable `timeBetweenVotes` which dictates how many blocks a validator must wait between votes.
   * @param timeBetweenVotes_ The number of blocks a validator must wait between consecutive votes.
   */
  constructor(uint256 timeBetweenVotes_) {
    timeBetweenVotes = timeBetweenVotes_;
    contractsDependenciesSet = false; // Initialize the flag
  }

  /**
   * @notice Sets the addresses of all essential external contracts this contract depends on.
   * @dev This function can only be called the contract owner after deployment.
   * It initializes references to various *Rules contracts and the VoteRules contract.
   * Ownership should ideally be renounced after this call.
   * @param contractDependency Addresses of system contracts used.
   */
  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    //require(!contractsDependenciesSet, "Dependencies already set"); // Enforce one-time call

    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = DeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = ResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = ContributorRules(contractDependency.contributorRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);

    contractsDependenciesSet = true; // Mark as set
  }

  // --- External Functions (State Modifying) ---

  /**
   * @notice Allows users to attempt to vote to invalidate an user.
   * @dev Votes to invalidate users with unwanted behavior.
   *
   * Requirements:
   * - The caller must be a registered voter user (verified by VoteRules).
   * - Caller level must be above average (verified by VoteRules.canVote implicitly).
   * - Caller must have waited `timeBetweenVotes` since their last vote.
   * - Caller must vote only once per user per era.
   * - The target user must be registered and not already denied.
   *
   * @param userAddress Invalidation user address.
   * @param justification Invalidation justification (max 300 characters).
   */
  function addUserValidation(address userAddress, string memory justification) public {
    require(bytes(justification).length <= 300, "Max 300 characters");
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(!communityRules.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!communityRules.userTypeIs(UserType.DENIED, userAddress), "User already denied");

    uint256 currentEra = userCurrentEra(userAddress);

    require(!validatorUsersValidations[msg.sender][userAddress][currentEra], "Already voted");
    require(waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    validatorUsersValidations[msg.sender][userAddress][currentEra] = true;
    validatorLastVoteAt[msg.sender] = block.number;

    uint256 _votesToInvalidate = votesToInvalidate();
    uint256 validationsCount = userValidations[userAddress][currentEra].length.add(1);

    userValidations[userAddress][currentEra].push(
      UserValidation(msg.sender, userAddress, justification, _votesToInvalidate, block.number)
    );

    if (validationsCount >= _votesToInvalidate) denyUser(userAddress);
  }

  /**
   * @notice Allows allowed callers (e.g., InspectorRules) to record a validation vote against an inspection.
   * @dev This function is intended to be called by the `InspectorRules` contract.
   * It records a validation vote for an inspection and applies penalties if enough votes accumulate.
   *
   * Requirements:
   * - Caller must be an allowed contract (via `mustBeAllowedCaller`).
   * - The validator address must not have already voted for this specific inspection.
   *
   * @param inspection Inspection data.
   * @param justification Invalidation justification.
   * @param validatorAddress Address of the voter.
   */
  function addInspectionValidation(
    Inspection memory inspection,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(bytes(justification).length <= 300, "Max 300 characters");
    require(!validatorInspectionsValidations[validatorAddress][inspection.id], "Already voted");

    validatorInspectionsValidations[validatorAddress][inspection.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 _votesToInvalidate = votesToInvalidate();

    bool addPenalty = inspection.validationsCount >= _votesToInvalidate;

    inspectionValidations[inspection.id].push(
      ResourceValidation(validatorAddress, inspection.id, justification, _votesToInvalidate, block.number)
    );

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);
    removeUserInspection(inspection);

    emit ResourceInvalidated("Inspection", inspection.id, inspection.inspector, inspectorTotalPenalties); // Emit event

    if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) denyUser(inspection.inspector);
  }

  /**
   * @notice Allows allowed callers (e.g., DeveloperRules) to record a validation vote against a report.
   * @dev This function is intended to be called by the `DeveloperRules` contract.
   * It records a validation vote for a report and applies penalties if enough votes accumulate.
   *
   * Requirements:
   * - Caller must be an allowed contract (via `mustBeAllowedCaller`).
   * - The validator address must not have already voted for this specific report.
   *
   * @param report Report data.
   * @param justification Invalidation justification.
   * @param validatorAddress Address of the voter.
   */
  function addReportValidation(
    Report memory report,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(bytes(justification).length <= 300, "Max 300 characters");
    require(!validatorReportsValidations[validatorAddress][report.id], "Already voted");

    validatorReportsValidations[validatorAddress][report.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    reportValidations[report.id].push(
      ResourceValidation(validatorAddress, report.id, justification, votesToInvalidate(), block.number)
    );

    if (report.valid) return;

    uint256 developerTotalPenalties = developerRules.addPenalty(report.developer, report.id);

    removeDeveloperReport(report);

    emit ResourceInvalidated("Report", report.id, report.developer, developerTotalPenalties); // Emit event

    if (developerTotalPenalties >= developerRules.MAX_PENALTIES()) denyUser(report.developer);
  }

  /**
   * @notice Allows allowed callers (e.g., ContributorRules) to record a validation vote against a contribution.
   * @dev This function is intended to be called by the `ContributorRules` contract.
   * It records a validation vote for a contribution and applies penalties if enough votes accumulate.
   *
   * Requirements:
   * - Caller must be an allowed contract (via `mustBeAllowedCaller`).
   * - The validator address must not have already voted for this specific contribution.
   *
   * @param contribution Contribution data.
   * @param justification Invalidation justification.
   * @param validatorAddress Address of the voter.
   */
  function addContributionValidation(
    Contribution memory contribution,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(bytes(justification).length <= 300, "Max 300 characters");
    require(!validatorContributionsValidations[validatorAddress][contribution.id], "Already voted");

    validatorContributionsValidations[validatorAddress][contribution.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    contributionValidations[contribution.id].push(
      ResourceValidation(validatorAddress, contribution.id, justification, votesToInvalidate(), block.number)
    );

    if (contribution.valid) return;

    uint256 contributorTotalPenalties = contributorRules.addPenalty(contribution.user, contribution.id);

    removeContributorContribution(contribution);

    emit ResourceInvalidated("Contribution", contribution.id, contribution.user, contributorTotalPenalties); // Emit event

    if (contributorTotalPenalties >= contributorRules.MAX_PENALTIES()) denyUser(contribution.user);
  }

  /**
   * @notice Allows allowed callers (e.g., ResearcherRules) to record a validation vote against a research.
   * @dev This function is intended to be called by the `ResearcherRules` contract.
   * It records a validation vote for a research and applies penalties if enough votes accumulate.
   *
   * Requirements:
   * - Caller must be an allowed contract (via `mustBeAllowedCaller`).
   * - The validator address must not have already voted for this specific research.
   *
   * @param research Research data.
   * @param justification Invalidation justification.
   * @param validatorAddress Address of the voter.
   */
  function addResearchValidation(
    Research memory research,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(bytes(justification).length <= 300, "Max 300 characters");
    require(!validatorResearchesValidations[validatorAddress][research.id], "Already voted");

    validatorResearchesValidations[validatorAddress][research.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    researchValidations[research.id].push(
      ResourceValidation(validatorAddress, research.id, justification, votesToInvalidate(), block.number)
    );

    if (research.valid) return;

    uint256 totalPenalties = researcherRules.addPenalty(research.createdBy, research.id);
    removeReseacherResearch(research);

    emit ResourceInvalidated("Research", research.id, research.createdBy, totalPenalties); // Emit event

    if (totalPenalties >= researcherRules.MAX_PENALTIES()) denyUser(research.createdBy);
  }

  // --- Internal Functions ---

  /**
   * @dev Determines the current era for a given user's type.
   * @param userAddress The address of the user.
   * @return era The current era for the user's specific type pool.
   */
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

  /**
   * @dev Sets a user's type to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function denyUser(address userAddress) internal {
    removeLevelsFromPool(userAddress, 0); // Remove all levels (0 means all for denied users)

    communityRules.setDeniedType(userAddress);
    emit UserDenied(userAddress); // Emit event for user denial
  }

  /**
   * @dev Function that removes levels from pool of a denied user
   * @param userAddress Invalidated userAddress
   * @param levels Levels to remove
   */
  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = communityRules.getUser(userAddress);

    if (oldUserType == UserType.DENIED) return; // Already denied, nothing to do
    // Check for each user type and call their respective removePoolLevels function
    if (oldUserType == UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress, levels);
  }

  // --- View Functions ---

  /**
   * @notice Get all user validations for a specific user in a given era.
   * @dev Retrieves an array of `UserValidation` structs for a specified user and era.
   * @param userAddress The address of the user.
   * @param currentEra The era to check for validations.
   * @return UserValidation[] An array of `UserValidation` structs.
   */
  function getUserValidations(address userAddress, uint256 currentEra) public view returns (UserValidation[] memory) {
    return userValidations[userAddress][currentEra];
  }

  /**
   * @notice Get how many validations is necessary to invalidate a user or resource.
   * @dev Calculates the required number of votes for invalidation based on the total number of registered voters in the system.
   * Calculation is based on the `votersCount` which includes activists, researchers, developers, and contributors.
   * @return count Number of votes required for invalidation.
   */
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

  /**
   * @notice Check if a validator can vote based on their last vote block number and `timeBetweenVotes`.
   * @dev Returns true if the current block number is past `validatorLastVoteAt` + `timeBetweenVotes`,
   * or if the validator has never voted before.
   * @param validatorAddress The address of the validator.
   * @return bool True if the validator can vote, false otherwise.
   */
  function waitedTimeBetweenVotes(address validatorAddress) public view returns (bool) {
    uint256 lastVoteAt = validatorLastVoteAt[validatorAddress];

    bool canVote = block.number > lastVoteAt.add(timeBetweenVotes);
    return canVote || lastVoteAt <= 0;
  }
}
