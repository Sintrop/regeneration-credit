// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IRegeneratorRules } from "./interfaces/IRegeneratorRules.sol";
import { IInspectorRules } from "./interfaces/IInspectorRules.sol";
import { IDeveloperRules } from "./interfaces/IDeveloperRules.sol";
import { IResearcherRules } from "./interfaces/IResearcherRules.sol";
import { IContributorRules } from "./interfaces/IContributorRules.sol";
import { IActivistRules } from "./interfaces/IActivistRules.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Regenerator } from "./types/RegeneratorTypes.sol";
import { Report } from "./types/DeveloperTypes.sol";
import { Research } from "./types/ResearcherTypes.sol";
import { Contribution } from "./types/ContributorTypes.sol";
import { ContractsDependency } from "./types/ValidationTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ValidationRules
 * @author Sintrop
 * @dev Manage validators rules and data. This contract is responsible for reviewing and voting to invalidate wrong or corrupted actions across different user types and resources.
 * @notice Responsible for reviewing and voting to invalidate users and resources.
 */
contract ValidationRules is Callable, ReentrancyGuard {
  // --- Constants ---

  /// @notice Number of inspections required for a Regenerator to achieve validation immunity.
  uint8 private constant REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD = 5;

  /// @notice Max character length for the justification provided in a validation vote.
  uint16 private constant MAX_JUSTIFICATION_LENGTH = 300;

  /// @notice The number of levels to remove from a user when their resource is invalidated.
  uint256 private constant RESOURCE_INVALIDATION_LEVEL_PENALTY = 1;

  /// @notice Voter thresholds to invalidate a resource/user.
  uint32 private constant VOTERS_THRESHOLD_LEVEL_1 = 50;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_2 = 500;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_3 = 1000;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_4 = 2000;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_5 = 4000;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_6 = 8000;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_7 = 16000;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_MAX = 32000;

  /// @notice Votes thresholds to invalidate a resource/user.
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_1 = 2;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_2 = 5;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_3 = 10;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_4 = 20;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_5 = 40;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_6 = 80;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_7 = 160;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_8 = 320;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_MAX = 500;

  // --- State variables ---

  /// @notice The relationship between address and validations received by era.
  mapping(address => mapping(uint256 => uint256)) public userValidations;

  /// @notice Relationship between validator and report validation. Only one validation per resource allowed.
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;

  /// @notice Relationship between validator and contribution validation. Only one validation per resource allowed.
  mapping(address => mapping(uint256 => bool)) private validatorContributionsValidations;

  /// @notice Relationship between validator and inspection validation. Only one validation per resource allowed.
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;

  /// @notice Relationship between validator and research validation. Only one validation per resource allowed.
  mapping(address => mapping(uint256 => bool)) private validatorResearchesValidations;

  /// @notice Relationship between validator and user validation. Only one validation per user per era allowed.
  mapping(address => mapping(address => mapping(uint256 => bool))) private validatorUsersValidations;

  /// @notice Relationship between validator and last vote block.number.
  mapping(address => uint256) public validatorLastVoteAt;

  /// @notice CommunityRules contract address.
  ICommunityRules private communityRules;

  /// @notice RegeneratorRules contract address.
  IRegeneratorRules private regeneratorRules;

  /// @notice InspectorRules contract address.
  IInspectorRules private inspectorRules;

  /// @notice DeveloperRules contract address.
  IDeveloperRules private developerRules;

  /// @notice ResearcherRules contract address.
  IResearcherRules private researcherRules;

  /// @notice ContributorRules contract address.
  IContributorRules private contributorRules;

  /// @notice ActivistRules contract address.
  IActivistRules private activistRules;

  /// @notice VoteRules contract address.
  IVoteRules private voteRules;

  /// @notice Amount of blocks between votes.
  uint256 public immutable timeBetweenVotes;

  // --- Constructor ---

  /**
   * @notice Initializes the ValidationRules contract with a minimum time between votes.
   * @dev Sets the immutable `timeBetweenVotes` which dictates how many blocks a validator must wait between votes.
   * @param timeBetweenVotes_ The number of blocks a validator must wait between consecutive votes.
   */
  constructor(uint256 timeBetweenVotes_) {
    timeBetweenVotes = timeBetweenVotes_;
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contracts dependency. This function must be called only once after the contract deploy and ownership must be renounced.
   * @param contractDependency Addresses of system contracts used.
   */
  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = ICommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = IRegeneratorRules(contractDependency.regeneratorRulesAddress);
    inspectorRules = IInspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = IDeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = IResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = IContributorRules(contractDependency.contributorRulesAddress);
    activistRules = IActivistRules(contractDependency.activistRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
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
   * - If the target user is a Regenerator, they must have fewer than 4 completed inspections to be eligible for invalidation.
   *
   * @param userAddress Invalidation user address.
   * @param justification Invalidation justification (Max characters).
   */
  function addUserValidation(address userAddress, string memory justification) public nonReentrant {
    require(bytes(justification).length <= MAX_JUSTIFICATION_LENGTH, "Max characters");
    require(voteRules.canVote(msg.sender), "Not a voter");
    require(!communityRules.userTypeIs(CommunityTypes.UserType.UNDEFINED, userAddress), "User not registered");
    require(!communityRules.userTypeIs(CommunityTypes.UserType.DENIED, userAddress), "User already denied");
    require(_checkImmunity(userAddress), "Regenerator has reached validation immunity");

    uint256 currentEra = _userCurrentEra(userAddress);

    require(!validatorUsersValidations[msg.sender][userAddress][currentEra], "Already voted");
    require(waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    validatorUsersValidations[msg.sender][userAddress][currentEra] = true;
    validatorLastVoteAt[msg.sender] = block.number;
    userValidations[userAddress][currentEra]++;

    uint256 _votesToInvalidate = votesToInvalidate();
    uint256 validationsCount = userValidations[userAddress][currentEra];

    emit UserValidation(msg.sender, userAddress, justification);

    if (validationsCount >= _votesToInvalidate) _denyUser(userAddress);
  }

  /**
   * @notice Allows allowed callers (e.g., InspectorRules) to record a validation vote against an inspection.
   * @dev This function is intended to be called by the `InspectionRules` contract.
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
  ) public mustBeAllowedCaller nonReentrant {
    require(!validatorInspectionsValidations[validatorAddress][inspection.id], "Already voted");

    validatorInspectionsValidations[validatorAddress][inspection.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 _votesToInvalidate = votesToInvalidate();

    bool addPenalty = inspection.validationsCount >= _votesToInvalidate;

    emit InspectionValidation(validatorAddress, inspection.id, justification);

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);
    _removeUserInspection(inspection);

    emit ResourceInvalidated("Inspection", inspection.id, inspection.inspector, inspectorTotalPenalties); // Emit event

    if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) _denyUser(inspection.inspector);
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
  ) public mustBeAllowedCaller nonReentrant {
    require(!validatorReportsValidations[validatorAddress][report.id], "Already voted");

    validatorReportsValidations[validatorAddress][report.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    emit ReportValidation(validatorAddress, report.id, justification);

    if (report.valid) return;

    uint256 developerTotalPenalties = developerRules.addPenalty(report.developer, report.id);

    _removeReport(report);

    emit ResourceInvalidated("Report", report.id, report.developer, developerTotalPenalties); // Emit event

    if (developerTotalPenalties >= developerRules.maxPenalties()) _denyUser(report.developer);
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
  ) public mustBeAllowedCaller nonReentrant {
    require(!validatorContributionsValidations[validatorAddress][contribution.id], "Already voted");

    validatorContributionsValidations[validatorAddress][contribution.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    emit ContributionValidation(validatorAddress, contribution.id, justification);

    if (contribution.valid) return;

    uint256 contributorTotalPenalties = contributorRules.addPenalty(contribution.user, contribution.id);

    _removeContribution(contribution);

    emit ResourceInvalidated("Contribution", contribution.id, contribution.user, contributorTotalPenalties); // Emit event

    if (contributorTotalPenalties >= contributorRules.maxPenalties()) _denyUser(contribution.user);
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
  ) public mustBeAllowedCaller nonReentrant {
    require(!validatorResearchesValidations[validatorAddress][research.id], "Already voted");

    validatorResearchesValidations[validatorAddress][research.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    emit ResearchValidation(validatorAddress, research.id, justification);

    if (research.valid) return;

    uint256 totalPenalties = researcherRules.addPenalty(research.createdBy, research.id);
    _removeResearch(research);

    emit ResourceInvalidated("Research", research.id, research.createdBy, totalPenalties); // Emit event

    if (totalPenalties >= researcherRules.maxPenalties()) _denyUser(research.createdBy);
  }

  // --- Private Functions ---

  /**
   * @dev Determines the current era for a given user's type.
   * @param userAddress The address of the user.
   * @return era The current era for the user's specific type pool.
   */
  function _userCurrentEra(address userAddress) private view returns (uint256 era) {
    CommunityTypes.UserType userType = communityRules.getUser(userAddress);

    if (userType == CommunityTypes.UserType.ACTIVIST) return activistRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) return contributorRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.DEVELOPER) return developerRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.INSPECTOR) return inspectorRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.RESEARCHER) return researcherRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.REGENERATOR) return regeneratorRules.poolCurrentEra();
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool.
   * @param report Invalidated report.
   */
  function _removeReport(Report memory report) private {
    _removeUserLevels(report.developer, RESOURCE_INVALIDATION_LEVEL_PENALTY);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool.
   * @param contribution Invalidated contribution.
   */
  function _removeContribution(Contribution memory contribution) private {
    _removeUserLevels(contribution.user, RESOURCE_INVALIDATION_LEVEL_PENALTY);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool
   * @param research Invalidated research
   */
  function _removeResearch(Research memory research) private {
    _removeUserLevels(research.createdBy, RESOURCE_INVALIDATION_LEVEL_PENALTY);
  }

  /**
   * @dev Calls the fuction that removes the resource level from pool.
   * @param inspection Invalidated inspection.
   */
  function _removeUserInspection(Inspection memory inspection) private {
    inspectorRules.decrementInspections(inspection.inspector);
    regeneratorRules.decrementInspections(inspection.regenerator);

    _removeUserLevels(inspection.inspector, RESOURCE_INVALIDATION_LEVEL_PENALTY);
    _removeUserLevels(inspection.regenerator, inspection.regenerationScore);
  }

  /**
   * @dev Sets a user's type to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function _denyUser(address userAddress) private {
    _removeUserLevels(userAddress, 0); // Remove all levels (0 means all for denied users)

    // Inviter slashing mechanism
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    communityRules.setDeniedType(userAddress);
  }

  /**
   * @dev Function that removes levels from pool of a denied user.
   * @param userAddress Invalidated userAddress.
   * @param levels Levels to remove.
   */
  function _removeUserLevels(address userAddress, uint256 levels) private {
    CommunityTypes.UserType userType = communityRules.getUser(userAddress);

    if (userType == CommunityTypes.UserType.DENIED) return; // Already denied, nothing to do
    // Check for each user type and call their respective removePoolLevels function
    if (userType == CommunityTypes.UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, levels);
    if (userType == CommunityTypes.UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress, levels);
    if (userType == CommunityTypes.UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress, levels);
    if (userType == CommunityTypes.UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress, levels);
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress, levels);
    if (userType == CommunityTypes.UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress, levels);
  }

  function _checkImmunity(address addr) private view returns (bool) {
    if (!communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, addr)) return true;

    Regenerator memory regenerator = regeneratorRules.getRegenerator(addr);

    return regenerator.totalInspections < REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD;
  }

  // --- View Functions ---

  /**
   * @notice Get all user validations for a specific user in a given era.
   * @dev Retrieves an array of `UserValidation` structs for a specified user and era.
   * @param userAddress The address of the user.
   * @param currentEra The era to check for validations.
   * @return UserValidation[] An array of `UserValidation` structs.
   */
  function getUserValidations(address userAddress, uint256 currentEra) public view returns (uint256) {
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

    if (voters <= VOTERS_THRESHOLD_LEVEL_1) return VOTES_TO_INVALIDATE_LEVEL_1;
    if (voters <= VOTERS_THRESHOLD_LEVEL_2) return VOTES_TO_INVALIDATE_LEVEL_2;
    if (voters <= VOTERS_THRESHOLD_LEVEL_3) return VOTES_TO_INVALIDATE_LEVEL_3;
    if (voters <= VOTERS_THRESHOLD_LEVEL_4) return VOTES_TO_INVALIDATE_LEVEL_4;
    if (voters <= VOTERS_THRESHOLD_LEVEL_5) return VOTES_TO_INVALIDATE_LEVEL_5;
    if (voters <= VOTERS_THRESHOLD_LEVEL_6) return VOTES_TO_INVALIDATE_LEVEL_6;
    if (voters <= VOTERS_THRESHOLD_LEVEL_7) return VOTES_TO_INVALIDATE_LEVEL_7;
    if (voters <= VOTERS_THRESHOLD_LEVEL_MAX) return VOTES_TO_INVALIDATE_LEVEL_8;
    if (voters > VOTERS_THRESHOLD_LEVEL_MAX) return VOTES_TO_INVALIDATE_LEVEL_MAX;
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

    bool canVote = block.number > lastVoteAt + timeBetweenVotes;
    return canVote || lastVoteAt == 0;
  }

  // --- Events ---

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _userAddress The wallet of the user receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event UserValidation(address indexed _validatorAddress, address indexed _userAddress, string _justification);

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event InspectionValidation(address indexed _validatorAddress, uint256 _resourceId, string _justification);

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event ReportValidation(address indexed _validatorAddress, uint256 _resourceId, string _justification);

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event ContributionValidation(address indexed _validatorAddress, uint256 _resourceId, string _justification);

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event ResearchValidation(address indexed _validatorAddress, uint256 _resourceId, string _justification);

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
}
