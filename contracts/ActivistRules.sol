// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { Activist, Pool } from "./types/ActivistTypes.sol";
import { UserType, Invitation } from "./types/CommunityTypes.sol";
import { ActivistPool } from "./ActivistPool.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @author Sintrop
 * @title ActivistRules
 * @dev Manage activists rules and data
 * @notice User responsible for inviting new regenerators and inspectors
 */

contract ActivistRules is Callable, Invitable {
  /// @notice The relationship between address and activist data
  mapping(address => Activist) internal activists;

  /// @notice Checks if an activist has received level from an invited user
  mapping(address => mapping(address => bool)) internal activistWonLevel;

  /// @notice Activist approved invited users
  mapping(address => address[]) public activistApprovedUsers;

  /// @notice Activist approved invites
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
    require(bytes(name).length <= 100 && bytes(proofPhoto).length <= 100, "Max 100 characters");
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Activist memory activist = Activist(id, msg.sender, name, proofPhoto, Pool(0, activistPoolEra()), block.number);

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

    if (activist.id <= 0) return false;

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
   * @dev Allow an activist to receive pool levels
   * @notice Receive level when invited users complete three inspections
   * @param regeneratorAddress Invited regenerator wallet
   * @param regeneratorTotalInspections Invited regenerator total inspections
   * @param inspectorAddress Invited inspector wallet
   * @param inspectorTotalInspections Invited inspector total inspections
   */
  function addLevel(
    address regeneratorAddress,
    uint256 regeneratorTotalInspections,
    address inspectorAddress,
    uint256 inspectorTotalInspections
  ) external mustBeAllowedCaller {
    addLevelFromRegenerator(regeneratorAddress, regeneratorTotalInspections);
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
      setActivistLevel(activistAddress);
      activistApprovedInvites[activistAddress]++;
      activistApprovedUsers[activistAddress].push(regeneratorAddress);
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
      setActivistLevel(activistAddress);
      activistApprovedInvites[activistAddress]++;
      activistApprovedUsers[activistAddress].push(inspectorAddress);
    }
  }

  /**
   * @dev Increases activist level
   * @param activistAddress Activist wallet
   */
  function setActivistLevel(address activistAddress) internal {
    Activist memory activist = activists[activistAddress];

    if (activist.id == 0) return;

    activist.pool.level++;
    activists[activistAddress] = activist;

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
    require(communityRules.userTypeIs(UserType.ACTIVIST, msg.sender), "Pool only to activist");

    Activist memory activist = activists[msg.sender];
    uint256 currentEra = activist.pool.currentEra;

    require(activistPool.canWithdraw(currentEra), "Can't approve withdraw");

    activists[msg.sender].pool.currentEra++;

    activistPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Remove pool levels from activist
   * @param addr Activist wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Activist memory activist = activists[addr];

    activists[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : activist.pool.level;
    activistPool.removePoolLevels(addr, activistPoolEra(), removeSomeLevels);
  }

  /**
   * @dev Current actvistPool era
   * @return uint256 Return the current contract pool era
   */
  function activistPoolEra() internal view returns (uint256) {
    return activistPool.currentContractEra();
  }
}
