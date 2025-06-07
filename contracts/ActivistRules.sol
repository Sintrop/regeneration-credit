// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { Activist, Pool } from "./types/ActivistTypes.sol";
import { UserType, Invitation } from "./types/CommunityTypes.sol";
import { ActivistPool } from "./ActivistPool.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @title ActivistRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Activist" users
 * within the system. Activists are primarily responsible for inviting new Regenerators
 * and Inspectors, and they earn rewards based on the approval of their invited users.
 * @dev Inherits functionalities from `Callable` (for whitelisted function access) and `Invitable`
 * (for managing invitation logic). It interacts with `CommunityRules` for general user management
 * and `ActivistPool` for reward distribution.
 */

contract ActivistRules is Callable, Invitable {
  // --- State Variables ---

  /// @notice A mapping from an activist's wallet address to their detailed `Activist` data structure.
  /// This serves as the primary storage for activist profiles.
  mapping(address => Activist) internal activists;

  /// @notice A nested mapping to track whether an activist has already "won a level" (received credit)
  /// from a specific invited user (Regenerator or Inspector). Prevents duplicate level gains.
  /// Key: `activistAddress` -> Key: `invitedUserAddress` -> Value: `true` if level won.
  mapping(address => mapping(address => bool)) internal activistWonLevel;

  /// @notice A public mapping to track the total count of approved invitations for each activist.
  mapping(address => uint256) public activistApprovedInvites;

  /// @notice The relationship between id and activist address
  mapping(uint256 => address) public activistsAddress;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ActivistPool contract address
  ActivistPool internal activistPool;

  /// @notice Activist UserType
  UserType private constant USER_TYPE = UserType.ACTIVIST;

  /// @notice Total approved invites
  uint256 public approvedInvites;

  /// @notice Minimum 3 inspections to approve invite
  uint256 private constant MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS = 3;

  constructor(address communityRulesAddress, address activistPoolAddress) {
    communityRules = CommunityRules(communityRulesAddress);
    activistPool = ActivistPool(activistPoolAddress);
  }

  /**
   * @dev Allows a user to attempt to register as an activist
   * @notice Attempt to register as an activist
   *
   * Requirements:
   *
   * - the caller must have been invited before
   * - vacancies according to the number of regenerators
   *
   * @param name The name of the activist
   * @param proofPhoto Identity photo
   */
  function addActivist(string memory name, string memory proofPhoto) public {
    // Characters limit
    require(bytes(name).length <= 100 && bytes(proofPhoto).length <= 100, "Max 100 characters");
    // Max limit activist users
    require(communityRules.userTypesCount(USER_TYPE) <= 16000, "Max limit reached");

    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Activist memory activist = Activist(id, msg.sender, name, proofPhoto, Pool(0, poolCurrentEra()), block.number);

    activists[msg.sender] = activist;
    activistsAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Checks if an activist can send invite
   * @notice True if activist can send invite
   * @param addr The activist address
   */
  function canSendInvite(address addr) public view returns (bool) {
    Activist memory activist = activists[addr];

    // Return false if it is not an activist
    if (activist.id <= 0) return false;

    // Calls the invitable function to calculate if true or false
    return canInvite(approvedInvites, communityRules.userTypesTotalCount(USER_TYPE), activist.pool.level);
  }

  /**
   * @dev Return a specific activist
   * @param addr The address of the activist
   * @return Activist
   */
  function getActivist(address addr) public view returns (Activist memory) {
    return activists[addr];
  }

  /**
   * @dev Allow an activist to receive pool levels from invited regenerators
   * @notice Receive level when invited users complete three inspections
   * @param regeneratorAddress Invited regenerator wallet
   * @param regeneratorTotalInspections Invited regenerator total inspections

   */
  function addRegeneratorLevel(
    address regeneratorAddress,
    uint256 regeneratorTotalInspections
  ) external mustBeAllowedCaller {
    addLevelFromRegenerator(regeneratorAddress, regeneratorTotalInspections);
  }

  /**
   * @dev Allow an activist to receive pool levels from invited inspectors
   * @notice Receive level when invited users complete three inspections
   * @param inspectorAddress Invited inspector wallet
   * @param inspectorTotalInspections Invited inspector total inspections
   */
  function addInspectorLevel(address inspectorAddress, uint256 inspectorTotalInspections) external mustBeAllowedCaller {
    addLevelFromInspector(inspectorAddress, inspectorTotalInspections);
  }

  /**
   * @dev Add level to activist when invited regenerator reaches minimum inspections
   * @param regeneratorAddress Invited regenerator wallet
   * @param regeneratorTotalInspections Invited regenerator total inspections
   */
  function addLevelFromRegenerator(address regeneratorAddress, uint256 regeneratorTotalInspections) internal {
    Invitation memory regeneratorInvitation = communityRules.getInvitation(regeneratorAddress);
    address activistAddress = regeneratorInvitation.inviter;

    if (
      !activistWonLevel[activistAddress][regeneratorAddress] &&
      regeneratorTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[activistAddress][regeneratorAddress] = true;
      approvedInvites++;
      activistApprovedInvites[activistAddress]++;

      setActivistLevel(activistAddress);
    }
  }

  /**
   * @dev Add level to activist when invited inspector reaches minimum inspections
   * @param inspectorAddress Invited inspector wallet
   * @param inspectorTotalInspections Invited inspector total inspections
   */
  function addLevelFromInspector(address inspectorAddress, uint256 inspectorTotalInspections) internal {
    Invitation memory inspectorInvitation = communityRules.getInvitation(inspectorAddress);
    address activistAddress = inspectorInvitation.inviter;

    if (
      !activistWonLevel[activistAddress][inspectorAddress] &&
      inspectorTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[activistAddress][inspectorAddress] = true;
      approvedInvites++;
      activistApprovedInvites[activistAddress]++;

      setActivistLevel(activistAddress);
    }
  }

  /**
   * @dev Increases activist level
   * @param activistAddress Activist wallet
   */
  function setActivistLevel(address activistAddress) internal {
    Activist memory activist = activists[activistAddress];

    if (activist.id <= 0) return;

    // Inscrease the activist pool level
    activist.pool.level++;
    activists[activistAddress] = activist;

    // Add pool level to activist be able to withdraw tokens
    activistPool.addLevel(activistAddress, 1);
  }

  /**
   * @dev Call activistPool withdraw function to try to claim tokens
   * @notice Withdraw regeneration credits from activism service provided
   *
   * An approved user is when a regenerator or an inspector reach 3 valid inspection
   * the token distribution is proportional to the amount of approved users in the era
   *
   * Requirements:
   *
   * - only to activists
   * - to be eligible to withdraw tokens, you must have approved users in the era
   * - vacancies according to the number of regenerators
   */
  function withdraw() public {
    // Only activist can call the function
    require(communityRules.userTypeIs(UserType.ACTIVIST, msg.sender), "Pool only to activist");

    Activist memory activist = activists[msg.sender];
    uint256 currentEra = activist.pool.currentEra;

    // Checks if activist currentEra is below the pool era
    require(activistPool.canWithdraw(currentEra), "Can't approve withdraw");

    // Increase the activist pool era
    activists[msg.sender].pool.currentEra++;

    // Call the pool withdraw function
    activistPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Remove pool levels from activist
   * @param addr Activist wallet
   * @param levelsToRemove Levels to remove
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    Activist memory activist = activists[addr];

    activists[addr].pool.level -= levelsToRemove > 0 ? levelsToRemove : activist.pool.level;
    activistPool.removePoolLevels(addr, levelsToRemove);
  }

  /**
   * @dev Current actvistPool era
   * @return uint256 Return the current contract pool era
   */
  function poolCurrentEra() public view returns (uint256) {
    return activistPool.currentContractEra();
  }
}
