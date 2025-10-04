// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { IDeveloperPool } from "./interfaces/IDeveloperPool.sol";
import { IValidationRules } from "./interfaces/IValidationRules.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Developer, Pool, Report, Penalty, ContractsDependency } from "./types/DeveloperTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @title DeveloperRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Developer" users
 * within the system. Developers are primarily responsible for the development of the project
 * through submitting development reports, which are subject to validation and penalty mechanisms.
 * @dev Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
 * function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
 * for general user management, `DeveloperPool` for reward distribution, `VoteRules` for voting
 * eligibility, and `ValidationRules` for report validation processes.
 */
contract DeveloperRules is Callable, Invitable, ReentrancyGuard {
  // --- Constants ---

  /// @notice Maximum users count allowed for this UserType.
  uint16 public constant MAX_USER_COUNT = 16000;

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Max character length for text.
  uint16 private constant MAX_TEXT_LENGTH = 300;

  /// @notice Maximum possible level from a single resource.
  uint8 private constant RESOURCE_LEVEL = 1;

  // --- State variables ---

  /// @notice The maximum number of penalties a developer can accumulate before facing invalidation.
  uint8 public immutable maxPenalties;

  /// @notice The minimum number of blocks that must elapse between a developer's successful report publications.
  /// This prevents spamming or rapid consecutive report submissions.
  uint32 public immutable timeBetweenWorks;

  /// @notice The number of blocks before the end of an era during which no new reports can be published.
  /// This period allows validators sufficient time to analyze and vote on reports before the era concludes.
  uint32 public immutable securityBlocksToValidation;

  /// @notice The total count of development reports that are currently considered valid (not invalidated).
  uint64 public reportsCount;

  /// @notice The grand total count of all development reports ever submitted, including invalidated ones.
  /// This acts as a global unique ID counter for new reports.
  uint64 public reportsTotalCount;

  /// @notice The sum of all active levels from valid reports by non-denied developers.
  uint256 public totalActiveLevels;

  /// @notice A mapping from a developer's wallet address to their detailed `Developer` data structure.
  /// This serves as the primary storage for developer profiles.
  mapping(address => Developer) private developers;

  /// @notice A mapping from a unique report ID to its detailed `Report` data structure.
  /// Stores all submitted development reports.
  mapping(uint256 => Report) public reports;

  /// @notice A mapping from a developer's wallet address to an array of IDs of reports they have submitted.
  mapping(address => uint256[]) public reportsIds;

  /// @notice A mapping from a developer's wallet address to an array of `Penalty` structs they have received.
  mapping(address => Penalty[]) public penalties;

  /// @notice A mapping from a unique developer ID to their corresponding wallet address.
  /// Facilitates lookup of a developer's address by their ID.
  mapping(uint256 => address) public developersAddress;

  /// @notice Tracks report IDs that have already been invalidated.
  mapping(uint64 => bool) public reportPenalized;

  /// @notice The interface of the `CommunityRules` contract, used to interact with
  /// community-wide rules, user types, and invitation data.
  ICommunityRules public communityRules;

  /// @notice The interface of the `DeveloperPool` contract, responsible for managing
  /// and distributing token rewards to developers.
  IDeveloperPool public developerPool;

  /// @notice The interface of the `ValidationRules` contract, which defines the rules
  /// and processes for validating or invalidating development reports.
  IValidationRules public validationRules;

  /// @notice The interface of the `VoteRules` contract, which defines rules for user voting
  /// eligibility, particularly for report validation.
  IVoteRules public voteRules;

  /// @notice The address of the `InspectionRules` contract.
  address public validationRulesAddress;

  /// @notice The specific `UserType` enumeration value for a Developer user.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.DEVELOPER;

  /// @notice Tracks which validator has voted on which report to prevent duplicate votes.
  mapping(uint64 => mapping(address => bool)) private hasVotedOnReport;

  // --- Constructor ---

  /**
   * @dev Initializes the DeveloperRules contract with key parameters for report management.
   * Note: External contract addresses (`communityRules`, `developerPool`, etc.) are set via `setContractInterfaces`
   * after deployment, following an `onlyOwner` pattern for secure initialization.
   * @param timeBetweenWorks_ The required blocks between report publications.
   * @param maxPenalties_ The maximum allowed penalties for a developer.
   * @param securityBlocksToValidation_ The number of blocks before era end to block new report submissions.
   */
  constructor(uint32 timeBetweenWorks_, uint8 maxPenalties_, uint32 securityBlocksToValidation_) {
    timeBetweenWorks = timeBetweenWorks_;
    maxPenalties = maxPenalties_;
    securityBlocksToValidation = securityBlocksToValidation_;
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract interfaces.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param contractDependency Addresses of system contracts used.
   */
  function setContractInterfaces(ContractsDependency memory contractDependency) external onlyOwner {
    communityRules = ICommunityRules(contractDependency.communityRulesAddress);
    developerPool = IDeveloperPool(contractDependency.developerPoolAddress);
    validationRules = IValidationRules(contractDependency.validationRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _validationRulesAddress) external onlyOwner {
    validationRulesAddress = _validationRulesAddress;
  }

  // --- Public functions ---

  /**
   * @dev Allows a user to attempt to register as a developer.
   * Creates a new `Developer` profile for the caller if all requirements are met.
   * @notice Users must meet specific criteria (previous invitation, system vacancies)
   * to successfully register as a developer.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered developer.
   * - The `name` string must not exceed 50 characters in byte length.
   * - The `proofPhoto` string must not exceed 150 characters in byte length.
   * - The total number of `DEVELOPER` users in the system must not exceed 16,000.
   * @param name The chosen name for the developer.
   * @param proofPhoto A hash or identifier (e.g., URL) for the developer's identity verification photo.
   */
  function addDeveloper(string memory name, string memory proofPhoto) external {
    // Character limit validation for name and proofPhoto.
    require(bytes(name).length <= MAX_NAME_LENGTH && bytes(proofPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    // Max limit for developer users in the system.
    require(communityRules.userTypesCount(USER_TYPE) < MAX_USER_COUNT, "Max user limit");

    // Generate a unique ID for the new developer.
    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    developers[msg.sender] = Developer(id, msg.sender, name, proofPhoto, Pool(0, poolCurrentEra()), 0, block.number, 0);

    // Store the relationship between ID and address for lookup.
    developersAddress[id] = msg.sender;

    // Register the user with CommunityRules as a DEVELOPER.
    // This function checks proportionality, valid invitation and valid userType.
    communityRules.addUser(msg.sender, USER_TYPE);

    // Emit an event.
    emit DeveloperRegistered(id, msg.sender, name, block.number);
  }

  /**
   * @dev Allows a developer to attempt to publish a new development report.
   * @notice Development reports can only be published if certain time conditions and user type requirements are met.
   *
   * Requirements:
   * - The `description` string must not exceed 300 characters in byte length.
   * - The `report` hash/identifier string must not exceed 150 characters in byte length.
   * - The caller (`msg.sender`) must be a registered `DEVELOPER`.
   * - The current block number must be greater than `securityBlocksToValidation` blocks away
   * from the end of the current era (i.e., not within the security window).
   * - The developer must be eligible to publish based on `timeBetweenWorks` (checked via `canPublishReport`).
   * @param description A title or brief description of the report.
   * @param report A hash or identifier (e.g., IPFS CID) of the detailed development report file.
   */
  function addReport(string memory description, string memory report) external nonReentrant {
    // Character limit validation for description and report.
    require(
      bytes(description).length <= MAX_TEXT_LENGTH && bytes(report).length <= MAX_HASH_LENGTH,
      "Max characters reached"
    );
    // Only registered developers can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.DEVELOPER, msg.sender), "Only Developer");
    // Check if within the security window before era end.
    require(nextEraIn() > securityBlocksToValidation, "Wait until next era to add report");
    // Check if enough time has passed since the last publication.
    require(canPublishReport(msg.sender), "Can't publish yet");

    // Increment global report counters and assign a unique ID.
    reportsCount++;
    reportsTotalCount++;
    totalActiveLevels++;
    uint64 id = reportsTotalCount;

    // Increment developer's total reports count within their struct.
    developers[msg.sender].totalReports++;

    reports[id] = Report(id, poolCurrentEra(), msg.sender, description, report, 0, true, 0, block.number);

    // Record the report ID for the specific developer.
    reportsIds[msg.sender].push(id);

    // Increase the developer's pool level for this successful report.
    _updateLevel(msg.sender, id);

    // Emit an event for off-chain monitoring.
    emit ReportAdded(id, msg.sender, description, block.number);
  }

  /**
   * @dev Allows a validator to vote to invalidate a specific development report.
   * This process increments the validation count for the report and may trigger its invalidation.
   * @notice Only authorized validators can initiate this process after meeting specific time requirements.
   *
   * Requirements:
   * - The `justification` string must not exceed 300 characters in byte length.
   * - The caller (`msg.sender`) must be eligible to vote (checked via `voteRules.canVote`).
   * - The caller must have waited the required `timeBetweenVotes` (checked via `validationRules.waitedTimeBetweenVotes`).
   * - The target `report` must exist and be currently valid, and its era must be the current era or a past one.
   * @param id The unique ID of the report to be validated/invalidated.
   * @param justification A string explaining why the report is being invalidated.
   */
  function addReportValidation(uint64 id, string memory justification) external nonReentrant {
    // Check if user is valid.
    require(!communityRules.isDenied(msg.sender), "User denied");
    // Character limit validation for justification.
    require(bytes(justification).length <= MAX_TEXT_LENGTH, "Max characters");
    // Check if the caller is eligible to vote. User.level must be greater than average levels.
    require(voteRules.canVote(msg.sender), "Not a voter");
    // Check if the caller has waited the required time between votes.
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");
    // Check if the caller has already voted for this resource.
    require(!hasVotedOnReport[id][msg.sender], "Already voted");
    // Check if the resource has already been penalized.
    require(!reportPenalized[id], "Penalties already applied");

    hasVotedOnReport[id][msg.sender] = true;

    Report memory report = reports[id];

    require(report.valid && poolCurrentEra() == report.era, "This report is not VALID");

    // Increment the number of validations for this report.
    report.validationsCount += 1;
    reports[id] = report;

    uint256 votesNeeded = validationRules.votesToInvalidate();
    require(votesNeeded > 1, "Validation threshold cannot be less than 2");

    if (report.validationsCount >= votesNeeded) {
      // If threshold reached, invalidate the report.
      reportPenalized[id] = true;

      _invalidateReport(report);

      uint256 developerTotalPenalties = addPenalty(report.developer, id);

      // Emit event for invalidation.
      emit ReportInvalidated(id, report.developer, justification, totalPenalties(report.developer), block.number);

      if (developerTotalPenalties >= maxPenalties) {
        _denyDeveloper(report.developer);
      }
    }
    validationRules.updateValidatorLastVoteBlock(msg.sender);
    validationRules.addValidationPoint(msg.sender);

    emit ReportValidation(msg.sender, report.id, justification);
  }

  /**
   * @dev Allows a developer to initiate a withdrawal of Regeneration Credits
   * based on their published reports and current era.
   * @notice Developers can claim tokens for their development service.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `DEVELOPER`.
   * - The developer must be eligible for withdrawal in their current era (checked via `developerPool.canWithdraw`).
   * - The developer's current era (`developer.pool.currentEra`) will be incremented upon successful withdrawal attempt.
   */
  function withdraw() external nonReentrant {
    // Only registered developers can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.DEVELOPER, msg.sender), "Pool only to developer");

    Developer storage developer = developers[msg.sender];
    uint256 currentEra = developer.pool.currentEra;

    // Check if the developer is eligible to withdraw for the current era through DeveloperPool.
    require(developerPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    // Increment the developer's era in their local pool data.
    developer.pool.currentEra++;

    // Call the DeveloperPool contract to perform the actual token withdrawal.
    developerPool.withdraw(msg.sender, currentEra);

    // Emit an event for off-chain monitoring.
    emit DeveloperWithdrawalInitiated(msg.sender, currentEra, block.number);
  }

  // --- MustBeAllowedCaller functions ---

  /**
   * @dev Allows an authorized caller to remove levels from a developer's pool.
   * This function updates the developer's local level and notifies the `DeveloperPool` contract.
   * @notice Can only be called by whitelisted addresses, the ValidatorRules contract.
   * @param addr The wallet address of the developer from whom levels are to be removed.
   */
  function removePoolLevels(address addr) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) {
    totalActiveLevels -= developers[addr].pool.level;
    // Notify the DeveloperPool contract to adjust the developer's pool levels there as well.
    developerPool.removePoolLevels(addr, true);
  }

  // --- Private functions ---

  /**
   * @dev Adds a penalty to a developer's record when one of their reports is invalidated.
   * @param addr The wallet address of the developer receiving the penalty.
   * @param reportId The ID of the report associated with this penalty.
   * @return uint256 The total number of penalties the developer has accumulated.
   */
  function addPenalty(address addr, uint64 reportId) private returns (uint256) {
    // Add the penalty record to the penalties array.
    penalties[addr].push(Penalty(reportId));

    // Emit an event.
    emit PenaltyAdded(addr, reportId, block.number);

    return totalPenalties(addr);
  }

  /**
   * @dev Private function to execute the invalidation process for a development report.
   * Updates the report's status, decrements global valid reports count,
   * and records the invalidation time.
   * @param report A `Report` storage reference to the report being invalidated.
   */
  function _invalidateReport(Report memory report) private {
    reportsCount--;
    report.valid = false;
    report.invalidatedAt = block.number;
    reports[report.id] = report;
    developers[report.developer].pool.level -= RESOURCE_LEVEL;
    totalActiveLevels--;

    developerPool.removePoolLevels(report.developer, false);
  }

  /**
   * @dev Sets a user's to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function _denyDeveloper(address userAddress) private {
    if (communityRules.isDenied(userAddress)) return; // Already denied, nothing to do

    totalActiveLevels -= developers[userAddress].pool.level;

    communityRules.setToDenied(userAddress);

    // Inviter slashing mechanism.
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty.
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    developerPool.removePoolLevels(userAddress, true);
  }

  /**
   * @dev Private function to add a level to a developer's pool.
   * This function also updates the `lastPublishedAt` timestamp for the developer.
   * @param addr The wallet address of the developer whose level is to be increased.
   */
  function _updateLevel(address addr, uint64 reportId) private {
    Developer storage developer = developers[addr];
    developer.lastPublishedAt = block.number;
    developer.pool.level++;

    // Call the DeveloperPool contract about the level increase, enabling token withdrawal.
    developerPool.addLevel(addr, 1, reportId);

    // Emit an event.
    emit DeveloperLevelIncreased(addr, developer.pool.level, block.number);
  }

  // --- View functions ---

  /**
   * @dev Checks if a specific developer address is eligible to send new invitations.
   * @notice Only most active users _canSendInvite.
   * @param addr The address of the developer to check.
   * @return bool `true` if the developer is eligible to send an invite, `false` otherwise.
   */
  function canSendInvite(address addr) public view returns (bool) {
    Developer memory developer = developers[addr];

    // Return false if the address is not a registered developer (id is 0).
    if (developer.id <= 0) return false;

    // Calls the inherited `canInvite` function from `Invitable` to calculate eligibility.
    // This depends on total reports count, total developer count, and the developer's pool level.
    return canInvite(totalActiveLevels, communityRules.userTypesCount(USER_TYPE), developer.pool.level);
  }

  /**
   * @dev Returns a developer's detailed profile.
   * @notice Provides the full profile of a developer.
   * @param addr The address of the developer to retrieve.
   * @return developer The `Developer` struct containing the user's data.
   */
  function getDeveloper(address addr) public view returns (Developer memory developer) {
    return developers[addr];
  }

  /**
   * @dev Returns the detailed `Report` data for a given report ID.
   * @notice Provides the full details of a specific development report.
   * @param id The unique ID of the report to retrieve.
   * @return Report The `Report` struct containing the report's data.
   */
  function getReport(uint64 id) public view returns (Report memory) {
    return reports[id];
  }

  /**
   * @dev Returns an array of IDs of the reports made by a specific address.
   * @notice Provides a list of all reports submitted by a given user.
   * @param addr The address of the developer whose reports are to be retrieved.
   * @return uint256[] An array of report IDs.
   */
  function getReportsIds(address addr) public view returns (uint256[] memory) {
    return reportsIds[addr];
  }

  /**
   * @dev Returns the total number of penalties an address has accumulated.
   * @notice Provides the current penalty count for a specific developer.
   * @param addr The developer's wallet address.
   * @return uint256 The total number of penalties for the given address.
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Returns the current era as determined by the `DeveloperPool` contract.
   * @notice This function provides the current era from the perspective of the reward pool,
   * essential for era-based eligibility and reward calculations for developers.
   * @return uint256 The current era of the `DeveloperPool`.
   */
  function poolCurrentEra() public view returns (uint256) {
    return developerPool.currentContractEra();
  }

  /**
   * @dev Checks if a user can publish a new report based on `timeBetweenWorks`.
   * @notice This function determines if a developer has waited the required time since their last publication.
   * @param addr The address of the developer to check.
   * @return bool `true` if the developer can publish a report, `false` otherwise.
   */
  function canPublishReport(address addr) public view returns (bool) {
    uint256 lastPublishedAt = developers[addr].lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;

    // A user can publish if:
    // 1. Their last publication was long enough ago (`block.number > lastPublishedAt + timeBetweenWorks`).
    // 2. They have never published before (`lastPublishedAt == 0`).
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Calculates the number of blocks remaining until the start of the next era,
   * according to the `DeveloperPool` contract's era definition.
   * @notice Provides a countdown to the next era for report planning.
   * @return uint256 The amount of blocks remaining until the next era begins.
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(developerPool.nextEraIn(poolCurrentEra()));
  }

  // --- Events ---

  /// @dev Emitted when a new developer successfully registers.
  /// @param id The unique ID of the newly registered developer.
  /// @param developerAddress The wallet address of the developer.
  /// @param name The name provided by the developer.
  /// @param blockNumber The block number at which the registration occurred.
  event DeveloperRegistered(uint256 indexed id, address indexed developerAddress, string name, uint256 blockNumber);

  /// @dev Emitted when a new development report is successfully added by a developer.
  /// @param id The unique ID of the new report.
  /// @param developerAddress The address of the developer who submitted the report.
  /// @param description The description/title of the report.
  /// @param blockNumber The block number at which the report was added.
  event ReportAdded(uint256 indexed id, address indexed developerAddress, string description, uint256 blockNumber);

  /// @dev Emitted when a development report is officially invalidated after reaching the required votes.
  /// This event signifies a final state change for the report.
  /// @param reportId The ID of the report that was invalidated.
  /// @param developerAddress The address of the developer of the invalidated report.
  /// @param justification The justification provided by the validator who triggered the invalidation (last vote).
  /// @param newPenaltyCount The total number of penalties the developer now has.
  /// @param blockNumber The block number at which the report was invalidated.
  event ReportInvalidated(
    uint64 indexed reportId,
    address indexed developerAddress,
    string justification,
    uint256 newPenaltyCount,
    uint256 blockNumber
  );

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event ReportValidation(address indexed _validatorAddress, uint256 indexed _resourceId, string _justification);

  /// @dev Emitted when a penalty is added to a developer's record.
  /// @param developerAddress The address of the developer who received the penalty.
  /// @param associatedReportId The ID of the report linked to this penalty.
  /// @param blockNumber The block number at which the penalty was added.
  event PenaltyAdded(address indexed developerAddress, uint256 indexed associatedReportId, uint256 blockNumber);

  /// @dev Emitted when a developer successfully initiates a withdrawal of tokens.
  /// @param developerAddress The address of the developer initiating the withdrawal.
  /// @param era The era for which the withdrawal was initiated.
  /// @param blockNumber The block number at which the withdrawal was initiated.
  event DeveloperWithdrawalInitiated(address indexed developerAddress, uint256 indexed era, uint256 blockNumber);

  /// @dev Emitted when a developer's level is increased.
  /// @param developerAddress The address of the developer whose level was increased.
  /// @param newLevel The new total level of the developer.
  /// @param blockNumber The block number at which the level increase occurred.
  event DeveloperLevelIncreased(address indexed developerAddress, uint256 newLevel, uint256 blockNumber);
}
