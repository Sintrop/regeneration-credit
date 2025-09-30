// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { IContributorPool } from "./interfaces/IContributorPool.sol";
import { IValidationRules } from "./interfaces/IValidationRules.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Contributor, Pool, Contribution, Penalty, ContractsDependency } from "./types/ContributorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @title ContributorRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Contributor" users
 * within the system. Contributors perform generic contributions to the project and are subject
 * to validation and penalty mechanisms.
 * @dev Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
 * function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
 * for general user management, `ContributorPool` for reward distribution, `VoteRules` for voting
 * eligibility, and `ValidationRules` for contribution validation processes.
 */
contract ContributorRules is Callable, Invitable, ReentrancyGuard {
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

  /// @notice The maximum number of penalties a contributor can accumulate before being denied.
  uint8 public immutable maxPenalties;

  /// @notice The minimum number of blocks that must elapse between contribution publications.
  /// This prevents spamming or rapid consecutive contributions.
  uint32 public immutable timeBetweenWorks;

  /// @notice The number of blocks before the end of an era during which no new contributions can be published.
  /// This period allows validators sufficient time to analyze and vote on contributions before the era concludes.
  uint32 public immutable securityBlocksToValidation;

  /// @notice The total count of contributions that are currently considered valid (not invalidated).
  uint64 public contributionsCount;

  /// @notice The total count of all contributions ever submitted, including invalidated ones.
  /// This acts as a global unique ID counter for new contributions.
  uint64 public contributionsTotalCount;

  /// @notice The sum of all active levels from valid contributions by non-denied contributors.
  uint256 public totalActiveLevels;

  /// @notice A mapping from a contributor's wallet address to their detailed `Contributor` data structure.
  /// This serves as the primary storage for contributor profiles.
  mapping(address => Contributor) private contributors;

  /// @notice A mapping from a unique contribution ID to its detailed `Contribution` data structure.
  /// Stores all submitted contributions.
  mapping(uint256 => Contribution) public contributions;

  /// @notice A mapping from a unique contributor ID to their corresponding wallet address.
  /// Facilitates lookup of a contributor's address by their ID.
  mapping(uint256 => address) public contributorsAddress;

  /// @notice A mapping from a contributor's wallet address to an array of IDs of contributions they have made.
  mapping(address => uint256[]) public contributionsIds;

  /// @notice Tracks contribution IDs that have already been invalidated.
  mapping(uint64 => bool) public contributionPenalized;

  /// @notice The interface of the `CommunityRules` contract, used to interact with
  /// community-wide rules, user types, and invitation data.
  ICommunityRules public communityRules;

  /// @notice The interface of the `ContributorPool` contract, responsible for managing
  /// and distributing token rewards to contributors.
  IContributorPool public contributorPool;

  /// @notice The interface of the `ValidationRules` contract, which defines the rules
  /// and processes for validating or invalidating contributions.
  IValidationRules public validationRules;

  /// @notice The interface of the `VoteRules` contract, which defines rules for user voting
  /// eligibility, particularly for contribution validation.
  IVoteRules public voteRules;

  /// @notice The address of the `InspectionRules` contract.
  address public validationRulesAddress;

  /// @notice The specific `UserType` enumeration value for a Contributor user.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.CONTRIBUTOR;

  /// @notice A mapping from a contributor's wallet address to an array of `Penalty` structs they have received.
  mapping(address => Penalty[]) public penalties;

  /// @notice Tracks which validator has voted on which contribution to prevent duplicate votes.
  mapping(uint64 => mapping(address => bool)) private hasVotedOnContribution;

  // --- Constructor ---

  /**
   * @dev Initializes the ContributorRules contract with key parameters for contribution management.
   * Note: External contract addresses (`communityRules`, `contributorPool`, etc.) are set via `setContractInterfaces`
   * after deployment, following an `onlyOwner` pattern for secure initialization.
   * @param timeBetweenWorks_ The required blocks between contributions.
   * @param maxPenalties_ The maximum allowed penalties for a contributor.
   * @param securityBlocksToValidation_ The number of blocks before era end to block new contributions.
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
    contributorPool = IContributorPool(contractDependency.contributorPoolAddress);
    validationRules = IValidationRules(contractDependency.validationRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev onlyOwner function to set contract interfaces.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _validationRulesAddress) external onlyOwner {
    validationRulesAddress = _validationRulesAddress;
  }

  // --- Public functions ---

  /**
   * @dev Allows a user to attempt to register as a contributor.
   * Creates a new `Contributor` profile for the caller if all requirements are met.
   * @notice Users must meet specific criteria (previous invitation, system vacancies)
   * to successfully register as a contributor.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered contributor.
   * - The `name` string must not exceed 50 characters in byte length.
   * - The `proofPhoto` string must not exceed 150 characters in byte length.
   * - The total number of `CONTRIBUTOR` users in the system must not exceed 16,000.
   * @param name The chosen name for the contributor.
   * @param proofPhoto A hash or identifier for the contributor's identity verification photo.
   */
  function addContributor(string memory name, string memory proofPhoto) external {
    // Character limit validation for name and proofPhoto.
    require(bytes(name).length <= MAX_NAME_LENGTH && bytes(proofPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    // Max limit for contributor users in the system.
    require(communityRules.userTypesCount(USER_TYPE) < MAX_USER_COUNT, "Max user limit");

    // Generate a unique ID for the new contributor. Assumes userTypesTotalCount provides a globally unique counter.
    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    // Create a new Contributor struct.
    // Pool initialized with level 0 and current era set to the current pool era.
    // Penalties count initialized to 0.
    contributors[msg.sender] = Contributor(
      id,
      msg.sender,
      name,
      proofPhoto,
      Pool(0, poolCurrentEra()),
      0,
      block.number,
      0
    );
    // Store the relationship between ID and address for lookup.
    contributorsAddress[id] = msg.sender;

    // Attempt to reguster the user with CommunityRules as a CONTRIBUTOR.
    communityRules.addUser(msg.sender, USER_TYPE);

    // Emit an event for off-chain monitoring.
    emit ContributorRegistered(id, msg.sender, name, block.number);
  }

  /**
   * @dev Allows a contributor to attempt to publish a new contribution report.
   * @notice Contributions can only be published if certain time conditions and user type requirements are met.
   *
   * Requirements:
   * - The `description` string must not exceed 300 characters in byte length.
   * - The `report` hash/identifier string must not exceed 150 characters in byte length.
   * - The caller (`msg.sender`) must be a registered `CONTRIBUTOR`.
   * - The current block number must be greater than `securityBlocksToValidation` blocks away
   * from the end of the current era (not within the security window).
   * - The contributor must be eligible to publish based on `timeBetweenWorks` (checked via `canPublishContribution`).
   * @param description A title or brief description of the contribution.
   * @param report A hash or identifier (e.g., IPFS CID) of the detailed report file.
   */
  function addContribution(string memory description, string memory report) external nonReentrant {
    // Character limit validation for description and report.
    require(
      bytes(description).length <= MAX_TEXT_LENGTH && bytes(report).length <= MAX_HASH_LENGTH,
      "Max characters reached"
    );

    // Only registered contributors can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.CONTRIBUTOR, msg.sender), "Only Contributor");

    // Check if within the security window before era end.
    require(nextEraIn() > securityBlocksToValidation, "Wait until next era to add contribution");

    // Check if enough time has passed since the last publication.
    require(canPublishContribution(msg.sender), "Can't publish yet");

    // Increment global contribution counters and assign a unique ID.
    contributionsCount++;
    contributionsTotalCount++;
    totalActiveLevels++;
    uint64 id = contributionsTotalCount;

    // Increment contributor's total contributions count within their struct.
    contributors[msg.sender].totalContributions++;

    contributions[id] = Contribution(id, poolCurrentEra(), msg.sender, description, report, 0, true, 0, block.number);

    // Record the contribution ID for the specific contributor.
    contributionsIds[msg.sender].push(id);

    // Increase the contributor's pool level.
    _addPoolLevel(msg.sender, id);

    // Emit an event.
    emit ContributionAdded(id, msg.sender, description, block.number);
  }

  /**
   * @dev Allows a validator to cast a vote to invalidate a specific contribution.
   * This process increments the validation count for the contribution and may trigger its invalidation.
   * @notice Only authorized validators can initiate this process after meeting specific requirements.
   *
   * Requirements:
   * - The `justification` string must not exceed 300 characters in byte length.
   * - The caller (`msg.sender`) must be eligible to vote (checked via `voteRules.canVote`).
   * - The caller must have waited the required `timeBetweenVotes` (checked via `validationRules.waitedTimeBetweenVotes`).
   * - The target `contribution` must exist and be currently valid, and its era must be the current era or a past one.
   * @param id The unique ID of the contribution to be validated/invalidated.
   * @param justification A string explaining why the contribution is being invalidated.
   */
  function addContributionValidation(uint64 id, string memory justification) external nonReentrant {
    // Check if user is valid.
    require(!communityRules.isDenied(msg.sender), "User denied");
    // Character limit validation for justification.
    require(bytes(justification).length <= MAX_TEXT_LENGTH, "Max characters");
    // Check if the caller is eligible to vote.
    require(voteRules.canVote(msg.sender), "Not a voter");
    // Check if the caller has waited the required time between votes.
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");
    // Check if the caller has already voted for this resource.
    require(!hasVotedOnContribution[id][msg.sender], "Already voted");
    // Check if the resource has already been penalized.
    require(!contributionPenalized[id], "Penalties already applied");

    hasVotedOnContribution[id][msg.sender] = true;

    // Retrieve the contribution using a storage reference to modify it directly.
    Contribution memory contribution = contributions[id];

    // Check if contribution exists, is valid, and was made in the current or a past era.
    // Note: Validation must occur within the same era.
    require(contribution.valid && poolCurrentEra() == contribution.era, "This contribution is not VALID");

    // Increment the number of validations for this contribution.
    contribution.validationsCount += 1;
    contributions[id] = contribution;

    uint256 votesNeeded = validationRules.votesToInvalidate();
    require(votesNeeded > 1, "Validation threshold cannot be less than 2");

    if (contribution.validationsCount >= votesNeeded) {
      contributionPenalized[id] = true;

      // If threshold reached, invalidate the contribution.
      _invalidateContribution(contribution);

      uint256 contributorTotalPenalties = addPenalty(contribution.user, id);

      // Emit event for invalidation.
      emit ContributionInvalidated(
        id,
        contribution.user,
        justification,
        totalPenalties(contribution.user),
        block.number
      );

      if (contributorTotalPenalties >= maxPenalties) {
        _denyContributor(contribution.user);
      }
    }
    validationRules.updateValidatorLastVoteBlock(msg.sender);
    validationRules.addValidationPoint(msg.sender);

    emit ContributionValidation(msg.sender, contribution.id, justification);
  }

  /**
   * @dev Allows a contributor to initiate a withdrawal of Regeneration Credits
   * based on their published contributions and current era.
   * @notice Contributors can claim tokens for their contribution service.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `CONTRIBUTOR`.
   * - The contributor must be eligible for withdrawal in their current era (checked via `contributorPool.canWithdraw`).
   * - The contributor's current era (`contributor.pool.currentEra`) will be incremented upon successful withdrawal attempt.
   */
  function withdraw() external nonReentrant {
    // Only registered contributors can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.CONTRIBUTOR, msg.sender), "Pool only to contributor");

    // Retrieve contributor data.
    Contributor storage contributor = contributors[msg.sender];
    uint256 currentEra = contributor.pool.currentEra;

    // Check if the contributor is eligible to withdraw for the current era through ContributorPool.
    require(contributorPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    // Increment the contributor's era in their local pool data.
    contributor.pool.currentEra++;

    // Call the ContributorPool contract to perform the actual token withdrawal.
    contributorPool.withdraw(msg.sender, currentEra);

    // Emit an event.
    emit ContributorWithdrawalInitiated(msg.sender, currentEra, block.number);
  }

  // --- MustBeAllowedCaller functions ---

  /**
   * @dev Allows an authorized caller to remove levels from a contributor's pool.
   * This function updates the contributor's local level if user is not being denied and
   * notifies the `ContributorPool` contract to remove the pool level.
   * @notice Can only be called by ValidationRules address.
   * @param addr The wallet address of the contributor from whom levels are to be removed.
   */
  function removePoolLevels(address addr) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) {
    totalActiveLevels -= contributors[addr].pool.level;

    contributorPool.removePoolLevels(addr, true);
  }

  // --- Private functions ---

  /**
   * @dev Adds a penalty to a contributor's record when one of their contributions is invalidated.
   * @param addr The wallet address of the contributor receiving the penalty.
   * @param contributionId The ID of the contribution associated with this penalty.
   * @return uint256 The total number of penalties the contributor has accumulated.
   */
  function addPenalty(address addr, uint64 contributionId) private returns (uint256) {
    penalties[addr].push(Penalty(contributionId));

    return totalPenalties(addr);
  }

  /**
   * @dev Sets a user's to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function _denyContributor(address userAddress) private {
    if (communityRules.isDenied(userAddress)) return; // Already denied, nothing to do

    totalActiveLevels -= contributors[userAddress].pool.level;

    communityRules.setToDenied(userAddress);

    // Inviter slashing mechanism.
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty.
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    contributorPool.removePoolLevels(userAddress, true);
  }

  /**
   * @dev Private function to add a level to a contributor's pool.
   * This function also updates the `lastPublishedAt` timestamp for the contributor.
   * @param addr The wallet address of the contributor whose level is to be increased.
   */
  function _addPoolLevel(address addr, uint64 contributionId) private {
    Contributor storage contributor = contributors[addr];
    // If contributor does not exist, return.
    if (contributor.id == 0) return;

    contributor.lastPublishedAt = block.number; // Update last published block for this contributor.
    contributor.pool.level++; // Increase the contributor's local pool level.

    contributorPool.addLevel(addr, 1, contributionId);

    // Emit an event for off-chain monitoring.
    emit ContributorLevelIncreased(addr, contributor.pool.level, block.number);
  }

  /**
   * @dev Private function to execute the invalidation process for a contribution.
   * Updates the contribution's status, decrements valid contributions count,
   * and records the invalidation time.
   * @param contribution A `Contribution` storage reference to the contribution being invalidated.
   */
  function _invalidateContribution(Contribution memory contribution) private {
    contributionsCount--;
    contribution.valid = false;
    contribution.invalidatedAt = block.number;
    contributions[contribution.id] = contribution;
    contributors[contribution.user].pool.level -= RESOURCE_LEVEL;
    totalActiveLevels--;

    contributorPool.removePoolLevels(contribution.user, false);
  }

  // --- View functions ---

  /**
   * @dev Returns the detailed `Contributor` data for a given address.
   * @notice Provides the full profile of a contributor.
   * @param addr The address of the contributor to retrieve.
   * @return contributor The `Contributor` struct containing the user's data.
   */
  function getContributor(address addr) public view returns (Contributor memory contributor) {
    return contributors[addr];
  }

  /**
   * @dev Returns the detailed `Contribution` data for a given contribution ID.
   * @notice Provides the full details of a specific contribution.
   * @param id The unique ID of the contribution to retrieve.
   * @return Contribution The `Contribution` struct containing the contribution's data.
   */
  function getContribution(uint64 id) public view returns (Contribution memory) {
    return contributions[id];
  }

  /**
   * @dev Returns an array of IDs of the contributions made by a specific address.
   * @notice Provides a list of all contributions made by a given user.
   * @param addr The address of the contributor whose contributions are to be retrieved.
   * @return uint256[] An array of contribution IDs.
   */
  function getContributionsIds(address addr) public view returns (uint256[] memory) {
    return contributionsIds[addr];
  }

  /**
   * @dev Checks if a specific contributor address is eligible to send new invitations.
   * @notice Returns `true` if the contributor can send an invite, `false` otherwise.
   * @param addr The address of the contributor to check.
   * @return bool `true` if the contributor is eligible to send an invite, `false` otherwise.
   */
  function canSendInvite(address addr) public view returns (bool) {
    Contributor memory contributor = contributors[addr];

    // Return false if the address is not a registered contributor (id is 0).
    if (contributor.id <= 0) return false;

    // Calls the inherited `canInvite` function from `Invitable` to calculate eligibility.
    // This depends on total contributions count, total contributor count, and the contributor's pool level.
    return canInvite(totalActiveLevels, communityRules.userTypesCount(USER_TYPE), contributor.pool.level);
  }

  /**
   * @dev Returns the total number of penalties an address has accumulated.
   * @notice Provides the current penalty count for a specific contributor.
   * @param addr The contributor's wallet address.
   * @return uint256 The total number of penalties for the given address.
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Returns the current era as determined by the `ContributorPool` contract.
   * @notice This function provides the current era from the perspective of the reward pool.
   * @return uint256 The current era of the `ContributorPool`.
   */
  function poolCurrentEra() public view returns (uint256) {
    return contributorPool.currentContractEra();
  }

  /**
   * @dev Checks if a user can publish a new contribution based on `timeBetweenWorks`.
   * @notice This function determines if a contributor has waited the required time since their last publication.
   * @param addr The address of the contributor to check.
   * @return bool `true` if the contributor can publish a contribution, `false` otherwise.
   */
  function canPublishContribution(address addr) public view returns (bool) {
    uint256 lastPublishedAt = contributors[addr].lastPublishedAt;

    // A user can publish if:
    // 1. Their last publication was long enough ago (`block.number > lastPublishedAt + timeBetweenWorks`).
    // 2. They have never published before (`lastPublishedAt <= 0`).
    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Calculates the number of blocks remaining until the start of the next era,
   * according to the `ContributorPool` contract's era definition.
   * @notice Provides a countdown to the next era for contribution planning.
   * @return uint256 The amount of blocks remaining until the next era begins.
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(contributorPool.nextEraIn(poolCurrentEra()));
  }

  // --- Events ---

  /// @dev Emitted when a new contributor successfully registers.
  /// @param id The unique ID of the newly registered contributor.
  /// @param contributorAddress The wallet address of the contributor.
  /// @param name The name provided by the contributor.
  /// @param blockNumber The block number at which the registration occurred.
  event ContributorRegistered(uint256 indexed id, address indexed contributorAddress, string name, uint256 blockNumber);

  /// @dev Emitted when a new contribution is successfully added by a contributor.
  /// @param id The unique ID of the new contribution.
  /// @param contributorAddress The address of the contributor who submitted the contribution.
  /// @param description The description/title of the contribution.
  /// @param blockNumber The block number at which the contribution was added.
  event ContributionAdded(
    uint256 indexed id,
    address indexed contributorAddress,
    string description,
    uint256 blockNumber
  );

  /// @dev Emitted when a contribution is officially invalidated after reaching the required votes.
  /// This event signifies a final state change for the contribution.
  /// @param contributionId The ID of the contribution that was invalidated.
  /// @param contributorAddress The address of the contributor of the invalidated contribution.
  /// @param justification The justification provided by the validator who triggered the invalidation (last vote).
  /// @param newPenaltyCount The total number of penalties the contributor now has.
  /// @param blockNumber The block number at which the contribution was invalidated.
  event ContributionInvalidated(
    uint64 indexed contributionId,
    address indexed contributorAddress,
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
  event ContributionValidation(address indexed _validatorAddress, uint256 indexed _resourceId, string _justification);

  /// @dev Emitted when a contributor successfully initiates a withdrawal of tokens.
  /// @param contributorAddress The address of the contributor initiating the withdrawal.
  /// @param era The era for which the withdrawal was initiated.
  /// @param blockNumber The block number at which the withdrawal was initiated.
  event ContributorWithdrawalInitiated(address indexed contributorAddress, uint256 indexed era, uint256 blockNumber);

  /// @dev Emitted when a contributor's level is increased.
  /// @param contributorAddress The address of the contributor whose level was increased.
  /// @param newLevel The new total level of the contributor.
  /// @param blockNumber The block number at which the level increase occurred.
  event ContributorLevelIncreased(address indexed contributorAddress, uint256 newLevel, uint256 blockNumber);
}
