// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IActivistPool } from "./interfaces/IActivistPool.sol";
import { Activist, Pool } from "./types/ActivistTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @title ActivistRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Activist" users
 * within the system. Activists are responsible for inviting new Regenerators
 * and Inspectors, and they earn rewards based on the approval of their invited users.
 * @dev Inherits functionalities from `Callable` (for whitelisted function access) and `Invitable`
 * (for managing invitation logic). It interacts with `CommunityRules` for general user management
 * and `ActivistPool` for reward distribution.
 */

contract ActivistRules is Callable, Invitable, ReentrancyGuard {
  // --- Constants ---

  /// @notice Maximum possible level from a single invited.
  uint8 private constant RESOURCE_LEVEL = 1;

  /// @notice Maximum users count allowed for this UserType.
  uint16 public constant MAX_USER_COUNT = 16000;

  /// @notice Minimum inspections an inviter must complete to add activist level.
  uint16 public constant MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS = 3;

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or URL.
  uint16 private constant MAX_HASH_LENGTH = 150;

  // --- State variables ---

  /// @notice The total count of all invitations that have been successfully approved across the entire system.
  uint64 public approvedInvites;

  /// @notice The sum of all active levels from non-denied activists. Used for governance calculations.
  uint256 public totalActiveLevels;

  /// @notice A mapping from an activist's wallet address to their detailed `Activist` data structure.
  /// This serves as the primary storage for activist profiles.
  mapping(address => Activist) private activists;

  /// @notice A nested mapping to track whether an activist has already "won a level" (received credit)
  /// from a specific invited user (Regenerator or Inspector). Prevents duplicate level gains.
  /// Key: `activistAddress` -> Key: `invitedUserAddress` -> Value: `true` if level won.
  mapping(address => mapping(address => bool)) private activistWonLevel;

  /// @notice A public mapping from a unique activist ID to their corresponding wallet address.
  /// Facilitates lookup of an activist's address by their ID.
  mapping(uint256 => address) public activistsAddress;

  /// @notice The address of the `CommunityRules` contract, used to interact with
  /// community-wide rules, user types, and invitation data.
  ICommunityRules public communityRules;

  /// @notice The address of the `ActivistPool` contract, responsible for managing
  /// and distributing token rewards to activists.
  IActivistPool public activistPool;

  /// @notice The address of the `InspectionRules` contract.
  address public inspectionRulesAddress;

  /// @notice The address of the `InspectionRules` contract.
  address public validationRulesAddress;

  /// @notice The specific `UserType` enumeration value for the Activist user.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.ACTIVIST;

  // --- Constructor ---

  /**
   * @dev Initializes the ActivistRules contract.
   * Sets the addresses for the `CommunityRules` and `ActivistPool` contracts.
   * @param communityRulesAddress The address of the deployed `CommunityRules` contract.
   * @param activistPoolAddress The address of the deployed `ActivistPool` contract.
   */
  constructor(address communityRulesAddress, address activistPoolAddress) {
    communityRules = ICommunityRules(communityRulesAddress);
    activistPool = IActivistPool(activistPoolAddress);
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _inspectionRulesAddress Address of InspectionRules.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _inspectionRulesAddress, address _validationRulesAddress) external onlyOwner {
    inspectionRulesAddress = _inspectionRulesAddress;
    validationRulesAddress = _validationRulesAddress;
  }

  // --- Public functions (State modifying) ---

  /**
   * @dev Allows a user to attempt to register as an activist.
   * Creates a new `Activist` profile for the caller if all requirements are met.
   * @notice Users must meet specific criteria (previously invitation, system proportionality)
   * to successfully register as an activist.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered user.
   * - The `name` and `proofPhoto` strings must not exceed 100 characters in byte length.
   * - The total number of `ACTIVIST` users in the system must not exceed 16,000.
   * @param name The chosen name for the activist.
   * @param proofPhoto A hash or identifier for the activist's identity verification photo.
   */
  function addActivist(string memory name, string memory proofPhoto) external {
    // Character limit validation for name and proofPhoto.
    require(bytes(name).length <= MAX_NAME_LENGTH && bytes(proofPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    // Max limit for activist users in the system.
    require(communityRules.userTypesCount(USER_TYPE) < MAX_USER_COUNT, "Max user limit");

    // Generate a unique ID for the new activist.
    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    // Create a new Activist struct in memory.
    // Pool initialized with level 0 and current era set to the current pool era.
    activists[msg.sender] = Activist(id, msg.sender, name, proofPhoto, Pool(0, poolCurrentEra()), block.number);

    activistsAddress[id] = msg.sender;
    // Register the user with CommunityRules as an ACTIVIST.
    communityRules.addUser(msg.sender, USER_TYPE);

    // Emit event
    emit ActivistRegistered(id, msg.sender, name, block.number);
  }

  /**
   * @dev Allows an activist to initiate a withdrawal of Regeneration Credits
   * based on their approved invited users and current era.
   * @notice Activists can claim tokens for the services provided. The distribution
   * is proportional to the amount of approved users in the current era.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `ACTIVIST`.
   * - The activist must have approvedUsers in their current era.
   * - The activist's current era (`activist.pool.currentEra`) will be incremented upon successful withdrawal attempt.
   */
  function withdraw() external nonReentrant {
    // Only activist can call the function
    require(communityRules.userTypeIs(CommunityTypes.UserType.ACTIVIST, msg.sender), "Pool only to activist");

    // Retrieve activist data.
    Activist storage activist = activists[msg.sender];
    uint256 currentEra = activist.pool.currentEra;

    // Checks if activist currentEra is below the pool era
    require(activistPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    // Increase the activist pool era
    activist.pool.currentEra = currentEra + 1;

    // Call the pool withdraw function
    activistPool.withdraw(msg.sender, currentEra);

    // Emit an event.
    emit ActivistWithdrawalInitiated(msg.sender, currentEra, block.number);
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev External function for authorized callers to add a pool level to an activist
   * when an invited Regenerator reaches the minimum inspection threshold.
   * @notice This function should be called by the InspectionRules contract.
   * after a Regenerator completes their required inspections.
   * @param regeneratorAddress The wallet address of the invited Regenerator.
   * @param regeneratorTotalInspections The total number of inspections completed by the Regenerator.
   */
  function addRegeneratorLevel(
    address regeneratorAddress,
    uint256 regeneratorTotalInspections
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant {
    _addLevelFromRegenerator(regeneratorAddress, regeneratorTotalInspections);
  }

  /**
   * @dev External function for authorized callers to add a pool level to an activist
   * when an invited Inspector reaches the minimum inspection threshold.
   * @notice This function should be called by the InspectionRules contract
   * after an Inspector completes their required inspections.
   * @param inspectorAddress The wallet address of the invited Inspector.
   * @param inspectorTotalInspections The total number of inspections completed by the Inspector.
   */
  function addInspectorLevel(
    address inspectorAddress,
    uint256 inspectorTotalInspections
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant {
    _addLevelFromInspector(inspectorAddress, inspectorTotalInspections);
  }

  /**
   * @dev Allows an authorized caller to remove levels from an activist's pool.
   * This function updates the activist's local level if user is not being denied
   *  and notifies the `ActivistPool` contract to remove the pool level.
   * @notice Can only be called by the ValidationRules contract.
   * @param addr The wallet address of the activist from whom levels are to be removed.
   */
  function removePoolLevels(
    address addr
  ) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) nonReentrant {
    totalActiveLevels -= activists[addr].pool.level;

    activistPool.removePoolLevels(addr, true);
  }

  // --- Private functions ---

  /**
   * @dev Add level to activist when invited regenerator reaches minimum inspections.
   * @param regeneratorAddress Invited regenerator wallet.
   * @param regeneratorTotalInspections Invited regenerator total inspections.
   */
  function _addLevelFromRegenerator(address regeneratorAddress, uint256 regeneratorTotalInspections) private {
    require(
      communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, regeneratorAddress),
      "Address is not a Regenerator"
    );

    CommunityTypes.Invitation memory regeneratorInvitation = communityRules.getInvitation(regeneratorAddress);
    address activistAddress = regeneratorInvitation.inviter;

    if (
      !activistWonLevel[activistAddress][regeneratorAddress] &&
      regeneratorTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[activistAddress][regeneratorAddress] = true;

      bytes32 eventId = keccak256(abi.encodePacked("activist_reward_regenerator", activistAddress, regeneratorAddress));

      _setActivistLevel(activistAddress, eventId);
    }
  }

  /**
   * @dev Add level to activist when invited inspector reaches minimum inspections.
   * @param inspectorAddress Invited inspector wallet.
   * @param inspectorTotalInspections Invited inspector total inspections.
   */
  function _addLevelFromInspector(address inspectorAddress, uint256 inspectorTotalInspections) private {
    require(
      communityRules.userTypeIs(CommunityTypes.UserType.INSPECTOR, inspectorAddress),
      "Address is not a Inspector"
    );

    CommunityTypes.Invitation memory inspectorInvitation = communityRules.getInvitation(inspectorAddress);
    address activistAddress = inspectorInvitation.inviter;

    if (
      !activistWonLevel[activistAddress][inspectorAddress] &&
      inspectorTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[activistAddress][inspectorAddress] = true;

      bytes32 eventId = keccak256(abi.encodePacked("activist_reward_inspector", activistAddress, inspectorAddress));

      _setActivistLevel(activistAddress, eventId);
    }
  }

  /**
   * @dev Increases an activist's internal pool level and calls the `ActivistPool` contract
   * to reflect this level increase for token withdrawal purposes.
   * @param activistAddress The wallet address of the activist whose level is to be increased.
   */
  function _setActivistLevel(address activistAddress, bytes32 eventId) private {
    // Retrieve the activist's data.
    Activist storage activist = activists[activistAddress];

    // If activist does not exist, return.
    if (activist.id == 0) return;

    approvedInvites++;
    totalActiveLevels++;

    // Inscrease the activist pool level
    activist.pool.level++;

    // Add pool level to activist be able to withdraw tokens
    activistPool.addLevel(activistAddress, 1, eventId);

    // Emit an event for off-chain monitoring.
    emit ActivistLevelIncreased(activistAddress, activist.pool.level, block.number);
  }

  // --- View functions ---

  /**
   * @dev Checks if a specific activist address is eligible to send new invitations.
   * @notice Returns `true` if the activist can send an invite, `false` otherwise.
   * @param addr The address of the activist to check.
   * @return bool `true` if the activist is eligible to send an invite, `false` otherwise.
   */
  function canSendInvite(address addr) public view returns (bool) {
    Activist memory activist = activists[addr];

    // Return false if it is not an activist
    if (activist.id <= 0) return false;

    // Calls the inherited `canInvite` function from `Invitable` to calculate eligibility.
    // This depends on total approved invites, total activist count, and the activist's pool level.
    return canInvite(totalActiveLevels, communityRules.userTypesCount(USER_TYPE), activist.pool.level);
  }

  /**
   * @dev Returns the detailed `Activist` data for a given address.
   * @notice Provides the full profile of an activist.
   * @param addr The address of the activist to retrieve.
   * @return Activist The `Activist` struct containing the user's data.
   */
  function getActivist(address addr) public view returns (Activist memory) {
    return activists[addr];
  }

  /**
   * @dev Returns the current era as determined by the `ActivistPool` contract.
   * @notice This function provides the current era from the perspective of the reward pool.
   * @return uint256 The current era of the `ActivistPool`.
   */
  function poolCurrentEra() public view returns (uint256) {
    return activistPool.currentContractEra();
  }

  // --- Events ---

  /// @dev Emitted when a new activist successfully registers.
  /// @param id The unique ID of the newly registered activist.
  /// @param activistAddress The wallet address of the activist.
  /// @param name The name provided by the activist.
  /// @param blockNumber The block number at which the registration occurred.
  event ActivistRegistered(uint256 indexed id, address indexed activistAddress, string name, uint256 blockNumber);

  /// @dev Emitted when an activist's level is increased.
  /// @param activistAddress The address of the activist whose level was increased.
  /// @param newLevel The new total level of the activist.
  /// @param blockNumber The block number at which the level increase occurred.
  event ActivistLevelIncreased(address indexed activistAddress, uint256 newLevel, uint256 blockNumber);

  /// @dev Emitted when an activist successfully initiates a withdrawal of tokens.
  /// @param activistAddress The address of the activist initiating the withdrawal.
  /// @param era The era for which the withdrawal was initiated.
  /// @param blockNumber The block number at which the withdrawal was initiated.
  event ActivistWithdrawalInitiated(address indexed activistAddress, uint256 indexed era, uint256 blockNumber);
}
