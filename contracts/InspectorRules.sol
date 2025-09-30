// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IInspectorPool } from "./interfaces/IInspectorPool.sol";
import { Inspector, Penalty, Pool } from "./types/InspectorTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

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
  // --- Constants ---

  /// @notice The minimum number of completed inspections required for an inspector to be eligible for pool rewards.
  uint8 public constant MINIMUM_INSPECTIONS_TO_POOL = 3;

  /// @notice The maximum allowed number of "give-ups" (accepted but unrealized inspections)
  /// before an inspector's validity is affected (blocked from accepting new inspections).
  uint8 public constant MAX_GIVEUPS = 3;

  /// @notice The number of blocks an inspector must wait to accept a new inspection after realizing one.
  uint32 public constant BLOCKS_TO_ACCEPT = 6000;

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Maximum possible level from a single resource.
  uint8 private constant RESOURCE_LEVEL = 1;

  // --- State variables ---

  /// @notice The maximum number of penalties an inspector can accumulate before facing invalidation.
  uint8 public immutable maxPenalties;

  /// @notice A mapping from an inspector's wallet address to their detailed `Inspector` data structure.
  /// This serves as the primary storage for inspector profiles.
  mapping(address => Inspector) private inspectors;

  /// @notice A mapping from an inspector's wallet address to an array of `Penalty` structs they have received.
  mapping(address => Penalty[]) public penalties;

  /// @notice A mapping from a unique inspector ID to their corresponding wallet address.
  mapping(uint256 => address) public inspectorsAddress;

  /// @notice The address of the `CommunityRules` contract, used to interact with
  /// community-wide rules and user types.
  ICommunityRules public communityRules;

  /// @notice The address of the `InspectorPool` contract, responsible for managing
  /// and distributing token rewards to inspectors.
  IInspectorPool public inspectorPool;

  /// @notice The address of the `InspectionRules` contract.
  address public inspectionRulesAddress;

  /// @notice The specific `UserType` enumeration value for an Inspector user.
  /// This is a constant for gas efficiency and clarity.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.INSPECTOR;

  // --- Constructor ---

  /**
   * @dev Initializes the InspectorRules contract with key parameters.
   * @param communityRulesAddress The address of the deployed `CommunityRules` contract.
   * @param inspectorPoolAddress The address of the deployed `InspectorPool` contract.
   * @param maxPenalties_ The maximum allowed penalties for an inspector.
   */
  constructor(address communityRulesAddress, address inspectorPoolAddress, uint8 maxPenalties_) {
    communityRules = ICommunityRules(communityRulesAddress);
    inspectorPool = IInspectorPool(inspectorPoolAddress);
    maxPenalties = maxPenalties_;
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _inspectionRulesAddress Address of InspectionRules.
   */
  function setContractCall(address _inspectionRulesAddress) public onlyOwner {
    inspectionRulesAddress = _inspectionRulesAddress;
  }

  // --- Public functions (State modifying) ---

  /**
   * @dev Allows a user to attempt to register as an inspector.
   * Creates a new `Inspector` profile for the caller if all requirements are met.
   * @notice Users must meet specific criteria (previous invitation, system vacancies)
   * to successfully register as an inspector.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered user.
   * - The `name` string must not exceed `MAX_NAME_LENGTH` (50) characters in byte length.
   * - The `proofPhoto` string must not exceed `MAX_PROOF_PHOTO_LENGTH` (150) characters in byte length.
   * - Number of vacancies is proportional to the number of regenerators.
   * - The caller must have a previous valid invitation.
   * @param name The chosen name for the inspector.
   * @param proofPhoto A hash or identifier (e.g., URL) for the inspector's identity verification photo.
   */
  function addInspector(string memory name, string memory proofPhoto) external {
    require(bytes(name).length <= MAX_NAME_LENGTH && bytes(proofPhoto).length <= MAX_HASH_LENGTH, "Max characters");
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
  function withdraw() external nonReentrant {
    // Only registered inspectors can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.INSPECTOR, msg.sender), "Pool only to inspectors");

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
   * @dev Processes actions after an inspection is accepted by an inspector.
   * This marks the time of acceptance and increments the inspector's "give-up" count.
   * @notice This function is intended to be called by the InspectionRules contract.
   * @param addr The inspector's wallet address.
   * @param lastInspectionId The ID of the inspection that was accepted.
   */
  function afterAcceptInspection(
    address addr,
    uint64 lastInspectionId
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    _markLastInspection(addr, lastInspectionId);

    _incrementGiveUps(addr);
  }

  /**
   * @dev MustBeAllowedCaller function to handle actions after an inspector successfully realizes (completes) an inspection.
   * This decrements give-ups and increments total inspections.
   * @notice This function is called by the InspectionRules contract after an inspection is realized.
   * @param addr The inspector's wallet address.
   * @param score The inspection regenerationScore.
   * @param inspectionId The inspection unique ID.
   * @return uint256 The updated total number of inspections completed by the inspector.
   */
  function afterRealizeInspection(
    address addr,
    uint32 score,
    uint64 inspectionId
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant returns (uint256) {
    _decreaseGiveUps(addr);

    if (score > 0) {
      return _incrementInspections(addr, inspectionId);
    }

    return inspectors[addr].totalInspections;
  }

  /**
   * @dev Allows an authorized caller (`ValidationRules` contract) to add a penalty to an inspector's record.
   * This function should be called when an inspector's performance is unsatisfactory, for example,
   * without justification or proofPhoto.
   * @notice This function can only be called by addresses whitelisted via the `Callable` contract's mechanisms.
   * @param addr The wallet address of the inspector receiving the penalty.
   * @param inspectionId The ID of the inspection associated with this penalty.
   * @return uint256 The total number of penalties the inspector has accumulated.
   */
  function addPenalty(
    address addr,
    uint64 inspectionId
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant returns (uint256) {
    penalties[addr].push(Penalty(inspectionId));

    return totalPenalties(addr);
  }

  /**
   * @dev Allows the validator rules to remove levels from an inspector's pool.
   * This function updates the inspector's local level and notifies the `InspectorPool` contract.
   * @notice Should only be called by the ValidatorRules address.
   * @param addr The wallet address of the inspector from whom levels are to be removed.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(address addr, bool denied) external mustBeAllowedCaller nonReentrant {
    if (!denied) inspectors[addr].pool.level -= RESOURCE_LEVEL;

    inspectorPool.removePoolLevels(addr, denied);
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
  function decrementInspections(address addr) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    Inspector storage inspector = inspectors[addr];

    require(inspector.totalInspections > 0, "totalInspections invalid");

    inspector.totalInspections--;
  }

  /**
   * @dev Sets a user's to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function denyInspector(address userAddress) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    if (communityRules.isDenied(userAddress)) return; // Already denied, nothing to do

    communityRules.setToDenied(userAddress);

    // Inviter slashing mechanism.
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty.
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    inspectorPool.removePoolLevels(userAddress, true);
  }

  // --- Private functions (State modifying) ---

  /**
   * @dev Private function to increase an inspector's total completed inspections count
   * and update their `lastRealizedAt` block. Also triggers a level increase.
   * @param addr The inspector's wallet address.
   * @return uint256 The updated total number of inspections for the inspector.
   */
  function _incrementInspections(address addr, uint64 inspectionId) private returns (uint256) {
    Inspector storage inspector = inspectors[addr];

    require(inspector.id != 0, "Inspector does not exist");

    inspector.totalInspections++;
    inspector.lastRealizedAt = block.number;
    inspector.pool.level++;

    _addLevel(inspector, inspectionId);

    return inspector.totalInspections;
  }

  /**
   * @dev Private function to add a level to an inspector's pool.
   * This function increments the inspector's local pool level and notifies the `InspectorPool` contract,
   * but only if the inspector has reached the `MINIMUM_INSPECTIONS_TO_POOL` threshold.
   * @param inspector The inspector's wallet address.
   */
  function _addLevel(Inspector storage inspector, uint64 inspectionId) private {
    if (!_minimumInspections(inspector.totalInspections)) return;

    inspectorPool.addLevel(inspector.inspectorWallet, 1, inspectionId);

    emit InspectorLevelIncreased(inspector.inspectorWallet, inspector.pool.level, block.number);
  }

  /**
   * @dev Private function to increase an inspector's "give-up" count.
   * A give-up is recorded when an inspector accepts an inspection but fails to realize it in time.
   * @param addr The inspector's wallet address.
   */
  function _incrementGiveUps(address addr) private {
    inspectors[addr].giveUps++;
  }

  /**
   * @dev Private function to decrease an inspector's "give-up" count.
   * This is called when an inspector successfully realizes an inspection they had previously accepted.
   * @param addr The inspector's wallet address.
   */
  function _decreaseGiveUps(address addr) private {
    inspectors[addr].giveUps--;
  }

  /**
   * @dev Private function to handle actions after an inspector successfully accepts an inspection.
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

  /**
   * @dev Checks if an inspector has reached the `MINIMUM_INSPECTIONS_TO_POOL` threshold.
   * @param totalInspections The total number of inspections completed by the inspector.
   * @return bool `true` if the total inspections meet or exceed the minimum, `false` otherwise.
   */
  function _minimumInspections(uint256 totalInspections) private pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTIONS_TO_POOL;
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
   * @dev Checks if an inspector has less than `MAX_GIVEUPS` (maximum allowed give-ups).
   * Inspectors with `MAX_GIVEUPS` or more are considered invalid and blocked from core actions.
   * @param addr The inspector's wallet address.
   * @return bool `true` if the inspector is currently valid (has less than max give-ups), `false` otherwise.
   */
  function isInspectorValid(address addr) public view returns (bool) {
    return inspectors[addr].giveUps <= MAX_GIVEUPS;
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

    // 2. Enough time has passed since their last realized inspection (`block.number > lastRealizedAt + BLOCKS_TO_ACCEPT`).
    return block.number > lastRealizedAt + BLOCKS_TO_ACCEPT;
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
}
