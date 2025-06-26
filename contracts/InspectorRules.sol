// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { Inspector, Penalty, Pool } from "./types/InspectorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { InspectorPool } from "./InspectorPool.sol";

/**
 * @title InspectorRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Inspector" users
 * within the system. Inspectors are primarily responsible for collecting data from regenerators.
 * and performing inspections, which may be subject to penalties for non-compliance.
 * @dev Inherits functionalities from `Callable` (for whitelisted function access) and `Ownable` (for contract deploy setup).
 * It interacts with `CommunityRules` for general user management and `InspectorPool` for reward distribution.
 * This contract handles inspector registration, inspection tracking, give-ups, and penalties.
 */
contract InspectorRules is Callable, ReentrancyGuard {
  // --- Constants & state variables ---

  /// @notice The minimum number of completed inspections required for an inspector to be eligible for pool rewards.
  uint8 internal constant MINIMUM_INSPECTIONS_TO_POOL = 3;

  /// @notice The maximum allowed number of "give-ups" (accepted but unrealized inspections)
  /// before an inspector's validity is affected (blocked from accepting new inspections).
  uint8 private constant MAX_GIVEUPS = 3;

  /// @notice The maximum number of penalties an inspector can accumulate before facing invalidation.
  uint8 public immutable maxPenalties;

  /// @notice The number of blocks within which an accepted inspection must be realized.
  /// If an inspection is not realized within this period after being accepted, inspectors will sum one "give-up".
  uint32 public immutable blocksToAccept = 6000;

  /// @notice A mapping from an inspector's wallet address to their detailed `Inspector` data structure.
  /// This serves as the primary storage for inspector profiles.
  mapping(address => Inspector) internal inspectors;

  /// @notice A mapping from an inspector's wallet address to an array of `Penalty` structs they have received.
  mapping(address => Penalty[]) public penalties;

  /// @notice A mapping from a unique inspector ID to their corresponding wallet address.
  mapping(uint256 => address) public inspectorsAddress;

  /// @notice The address of the `CommunityRules` contract, used to interact with
  /// community-wide rules and user types.
  CommunityRules internal communityRules;

  /// @notice The address of the `InspectorPool` contract, responsible for managing
  /// and distributing token rewards to inspectors.
  InspectorPool internal inspectorPool;

  /// @notice The specific `UserType` enumeration value for an Inspector user.
  /// This is a constant for gas efficiency and clarity.
  UserType private constant USER_TYPE = UserType.INSPECTOR;

  // --- Constructor ---

  /**
   * @dev Initializes the InspectorRules contract with key parameters.
   * @param communityRulesAddress The address of the deployed `CommunityRules` contract.
   * @param inspectorPoolAddress The address of the deployed `InspectorPool` contract.
   * @param maxPenalties_ The maximum allowed penalties for an inspector.
   */
  constructor(address communityRulesAddress, address inspectorPoolAddress, uint8 maxPenalties_) {
    communityRules = CommunityRules(communityRulesAddress);
    inspectorPool = InspectorPool(inspectorPoolAddress);
    maxPenalties = maxPenalties_;
  }

  // --- External functions (State modifying) ---

  /**
   * @dev Allows a user to attempt to register as an inspector.
   * Creates a new `Inspector` profile for the caller if all requirements are met.
   * @notice Users must meet specific criteria (previous invitation, system vacancies)
   * to successfully register as an inspector.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered user.
   * - The `name` string must not exceed `MAX_NAME_LENGTH` (50) characters in byte length.
   * - The `proofPhoto` string must not exceed `MAX_PROOF_PHOTO_LENGTH` (100) characters in byte length.
   * - Number of vacancies is proportional to the number of regenerators.
   * - The caller must have a previous valid invitation.
   * @param name The chosen name for the inspector.
   * @param proofPhoto A hash or identifier (e.g., URL) for the inspector's identity verification photo.
   */
  function addInspector(string memory name, string memory proofPhoto) public {
    require(bytes(name).length <= 50 && bytes(proofPhoto).length <= 100, "Max 100 characters");
    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    inspectors[msg.sender] = Inspector(
      id,
      msg.sender,
      name,
      proofPhoto,
      0,
      0,
      0,
      0,
      0,
      Pool(0, poolCurrentEra()),
      block.number
    );

    // Store the relationship between ID and address for lookup.
    inspectorsAddress[id] = msg.sender;
    // Register the user with CommunityRules as an INSPECTOR. Other rules are applied at this function.
    communityRules.addUser(msg.sender, USER_TYPE);

    emit InspectorRegistered(id, msg.sender, name, block.number);
  }

  /**
   * @dev Allows an inspector to initiate a withdrawal of Regeneration Credits
   * based on their completed inspections and current era.
   * @notice Inspectors can claim tokens for their inspection service, provided they meet
   * the minimum inspection threshold and are eligible for the current era.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `INSPECTOR`.
   * - The inspector must have completed at least (3) inspections.
   * - The inspector must be eligible for withdrawal in their current era (checked via `inspectorPool.canWithdraw`).
   * - The inspector's current era (`inspector.pool.currentEra`) will be incremented upon successful withdrawal attempt.
   */
  function withdraw() public nonReentrant {
    // Only registered inspectors can call this function.
    require(communityRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Pool only to inspectors");

    Inspector storage inspector = inspectors[msg.sender];
    // Check if the inspector has completed the minimum required inspections.
    require(_minimumInspections(inspector.totalInspections), "Minimum inspections");

    uint256 currentEra = inspector.pool.currentEra;

    // Check if the inspector is eligible to withdraw for the current era through InspectorPool.
    require(inspectorPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    // Increment the inspector's era in their local pool data.
    inspector.pool.currentEra++;

    // Call the InspectorPool contract to perform the actual token withdrawal.
    inspectorPool.withdraw(msg.sender, currentEra);

    // Emit an event for off-chain monitoring.
    emit InspectorWithdrawalInitiated(msg.sender, currentEra, block.number);
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller (`ValidationRules` contract) to add a penalty to an inspector's record.
   * This function should be called when an inspector's performance is unsatisfactory, for example,
   * without justification or proofPhoto.
   * @notice This function can only be called by addresses whitelisted via the `Callable` contract's mechanisms.
   * @param addr The wallet address of the inspector receiving the penalty.
   * @param inspectionId The ID of the inspection associated with this penalty.
   * @return uint256 The total number of penalties the inspector has accumulated.
   */
  function addPenalty(address addr, uint64 inspectionId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(inspectionId));

    return totalPenalties(addr);
  }

  /**
   * @dev Processes actions after an inspection is accepted by an inspector.
   * This marks the time of acceptance and increments the inspector's "give-up" count.
   * @notice This function is intended to be called by the InspectionRules contract.
   * @param addr The inspector's wallet address.
   * @param lastInspectionId The ID of the inspection that was accepted.
   */
  function afterAcceptInspection(address addr, uint64 lastInspectionId) public mustBeAllowedCaller {
    _markLastInspection(addr, lastInspectionId);

    _incrementGiveUps(addr);
  }

  /**
   * @dev Internal function to handle actions after an inspector successfully realizes (completes) an inspection.
   * This decrements give-ups and increments total inspections.
   * @notice This function is called by the InspectionRules contract after an inspection is realized.
   * @param addr The inspector's wallet address.
   * @return uint256 The updated total number of inspections completed by the inspector.
   */
  function _afterRealizeInspection(address addr) public mustBeAllowedCaller returns (uint256) {
    _decreaseGiveUps(addr);

    return _incrementInspections(addr);
  }

  /**
   * @dev Allows the validator rules to remove levels from an inspector's pool.
   * This function updates the inspector's local level and notifies the `InspectorPool` contract.
   * @notice Should only be called by the ValidatorRules address.
   * @param addr The wallet address of the inspector from whom levels are to be removed.
   * @param levelsToRemove The number of levels to decrease. If `levelsToRemove` is 0,
   * this function sets the inspector's pool level to 0. Otherwise, it subtracts the specified amount.   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    Inspector storage inspector = inspectors[addr];

    inspector.pool.level -= levelsToRemove > 0 ? levelsToRemove : inspector.pool.level;

    inspectorPool.removePoolLevels(addr, levelsToRemove);

    // Emit an event.
    emit InspectorLevelRemoved(addr, levelsToRemove, inspector.pool.level, block.number);
  }

  /**
   * @dev Decrements an inspector's total completed inspections count.
   * This function is called when an inspection previously counted as valid is invalidated.
   * @notice Should only be called by the ValidatorRules address.
   * @param addr The inspector's wallet address.
   *
   * Requirements:
   * - The inspector's `totalInspections` count must be greater than 0.
   */
  function decrementInspections(address addr) public mustBeAllowedCaller {
    Inspector storage inspector = inspectors[addr];

    require(inspector.totalInspections > 0, "totalInspections invalid");

    inspector.totalInspections--;
  }

  // --- Internal/private functions (State modifying) ---

  /**
   * @dev Internal function to increase an inspector's total completed inspections count
   * and update their `lastRealizedAt` block. Also triggers a level increase.
   * @param addr The inspector's wallet address.
   * @return uint256 The updated total number of inspections for the inspector.
   */
  function _incrementInspections(address addr) private returns (uint256) {
    Inspector storage inspector = inspectors[addr];

    require(inspector.id != 0, "Inspector does not exist");

    inspector.totalInspections++;
    inspector.lastRealizedAt = block.number;
    inspector.pool.level++;

    _addLevel(inspector);

    return inspector.totalInspections;
  }

  /**
   * @dev Internal function to add a level to an inspector's pool.
   * This function increments the inspector's local pool level and notifies the `InspectorPool` contract,
   * but only if the inspector has reached the `MINIMUM_INSPECTIONS_TO_POOL` threshold.
   * @param inspector The inspector's wallet address.
   */
  function _addLevel(Inspector storage inspector) internal {
    if (!_minimumInspections(inspector.totalInspections)) return;

    inspectorPool.addLevel(inspector.inspectorWallet, 1);

    emit InspectorLevelIncreased(inspector.inspectorWallet, inspector.pool.level, block.number);
  }

  /**
   * @dev Internal function to increase an inspector's "give-up" count.
   * A give-up is recorded when an inspector accepts an inspection but fails to realize it in time.
   * @param addr The inspector's wallet address.
   */
  function _incrementGiveUps(address addr) private {
    inspectors[addr].giveUps++;
  }

  /**
   * @dev Internal function to decrease an inspector's "give-up" count.
   * This is called when an inspector successfully realizes an inspection they had previously accepted.
   * @param addr The inspector's wallet address.
   */
  function _decreaseGiveUps(address addr) private {
    inspectors[addr].giveUps--;
  }

  /**
   * @dev Internal function to handle actions after an inspector successfully accepts an inspection.
   * This updates the `lastAcceptedAt` block and the `lastInspection` ID.
   * @notice This function is called by an authorized external contract after an inspection is accepted.
   * @param addr The inspector's wallet address.
   * @param lastInspectionId The ID of the inspection that was just accepted.
   */
  function _markLastInspection(address addr, uint64 lastInspectionId) private {
    Inspector storage inspector = inspectors[addr];

    inspector.lastAcceptedAt = block.number;
    inspector.lastInspection = lastInspectionId;
  }

  // --- View functions ---

  /**
   * @dev Returns the total number of penalties an inspector address has accumulated.
   * @notice Provides the current penalty count for a specific inspector.
   * @param addr The inspector's wallet address.
   * @return uint256 The total number of penalties for the given address.
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Returns the detailed `Inspector` data for a given address.
   * @notice Provides the full profile of an inspector.
   * @param addr The address of the inspector to retrieve.
   * @return Inspector The `Inspector` struct containing the user's data.
   */
  function getInspector(address addr) public view returns (Inspector memory) {
    return inspectors[addr];
  }

  /**
   * @dev Returns the current era as determined by the `InspectorPool` contract.
   * @notice This function provides the current era from the perspective of the reward pool.   * @return uint256 The current era of the `InspectorPool`.
   */
  function poolCurrentEra() public view returns (uint256) {
    return inspectorPool.currentContractEra();
  }

  /**
   * @dev Checks if an inspector has reached the `MINIMUM_INSPECTIONS_TO_POOL` threshold.
   * @param totalInspections The total number of inspections completed by the inspector.
   * @return bool `true` if the total inspections meet or exceed the minimum, `false` otherwise.
   */
  function _minimumInspections(uint256 totalInspections) internal pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTIONS_TO_POOL;
  }

  /**
   * @dev Checks if an inspector has less than `MAX_GIVEUPS` (maximum allowed give-ups).
   * Inspectors with `MAX_GIVEUPS` or more are considered invalid and blocked from core actions.
   * @param addr The inspector's wallet address.
   * @return bool `true` if the inspector is currently valid (has less than max give-ups), `false` otherwise.
   */
  function isInspectorValid(address addr) public view returns (bool) {
    return inspectors[addr].giveUps < MAX_GIVEUPS;
  }

  /**
   * @dev Checks if an inspector is able to accept a new inspection, based on the time
   * elapsed since their last realized inspection.
   * @param addr The inspector's wallet address.
   * @return bool `true` if the inspector can accept a new inspection, `false` otherwise.
   */
  function canAcceptInspection(address addr) public view returns (bool) {
    uint256 lastRealizedAt = inspectors[addr].lastRealizedAt;

    // An inspector can accept if:
    // 1. They have never realized an inspection before (`lastRealizedAt == 0`).
    if (lastRealizedAt <= 0) return true;

    // 2. Enough time has passed since their last realized inspection (`block.number > lastRealizedAt + blocksToAccept`).
    return block.number > lastRealizedAt + blocksToAccept;
  }

  // --- Events ---

  /// @dev Emitted when a new inspector successfully registers.
  /// @param id The unique ID of the newly registered inspector.
  /// @param inspectorAddress The wallet address of the inspector.
  /// @param name The name provided by the inspector.
  /// @param blockNumber The block number at which the registration occurred.
  event InspectorRegistered(uint256 indexed id, address indexed inspectorAddress, string name, uint256 blockNumber);

  /// @dev Emitted when an inspector successfully initiates a withdrawal of tokens.
  /// @param inspectorAddress The address of the inspector initiating the withdrawal.
  /// @param era The era for which the withdrawal was initiated.
  /// @param blockNumber The block number at which the withdrawal was initiated.
  event InspectorWithdrawalInitiated(address indexed inspectorAddress, uint256 indexed era, uint256 blockNumber);

  /// @dev Emitted when an inspector's level is increased.
  /// @param inspectorAddress The address of the inspector whose level was increased.
  /// @param newLevel The new total level of the inspector.
  /// @param blockNumber The block number at which the level increase occurred.
  event InspectorLevelIncreased(address indexed inspectorAddress, uint256 newLevel, uint256 blockNumber);

  /// @dev Emitted when an inspector's pool levels are removed.
  /// @param inspectorAddress The address of the inspector whose levels were removed.
  /// @param levelsRemoved The number of levels that were removed.
  /// @param newLevel The new total level of the inspector after removal.
  /// @param blockNumber The block number at which the level removal occurred.
  event InspectorLevelRemoved(
    address indexed inspectorAddress,
    uint256 levelsRemoved,
    uint256 newLevel,
    uint256 blockNumber
  );
}
