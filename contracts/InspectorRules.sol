// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { Inspector, Penalty, Pool } from "./types/InspectorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { UserType } from "./types/UserTypes.sol";
import { InspectorPool } from "./InspectorPool.sol";

/**
 * @author Sintrop
 * @title InspectorRules
 * @dev Manage inspectors rules and data
 * @notice Responsible for collecting regenerators data
 */
contract InspectorRules is Callable {
  uint256 internal constant MINIMUM_INSPECTIONS_TO_POOL = 3;

  mapping(address => Inspector) internal inspectors;
  mapping(address => Penalty[]) public penalties;

  UserRules internal userRules;
  InspectorPool internal inspectorPool;
  address[] internal inspectorsAddress;
  UserType private constant USER_TYPE = UserType.INSPECTOR;

  uint256 public immutable maxPenalties;
  uint256 private constant MAX_GIVEUPS = 3;

  constructor(address userRulesAddress, address inspectorPoolAddress, uint256 maxPenalties_) {
    userRules = UserRules(userRulesAddress);
    inspectorPool = InspectorPool(inspectorPoolAddress);
    maxPenalties = maxPenalties_;
  }

  /**
   * @dev Allows a user to attempt to register as an inspector
   * @param name The name of the inspector
   * @param proofPhoto Identity photo
   */
  function addInspector(string memory name, string memory proofPhoto) public returns (Inspector memory) {
    Inspector memory inspector = Inspector(
      userRules.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      name,
      proofPhoto,
      0,
      0,
      0,
      0,
      Pool(0, inspectorPoolEra()),
      block.number
    );

    inspectors[msg.sender] = inspector;
    inspectorsAddress.push(msg.sender);
    userRules.addUser(msg.sender, USER_TYPE);

    return inspector;
  }

  function addPenalty(address addr, uint256 inspectionId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(inspectionId));

    return totalPenalties(addr);
  }

  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Return a specific inspector
   * @param addr the address of the inspector.
   */
  function getInspector(address addr) public view returns (Inspector memory) {
    return inspectors[addr];
  }

  /**
   * @dev Check if a specific inspector exists
   * @return a bool that represent if a inspector exists or not
   */
  function inspectorExists(address addr) public view returns (bool) {
    return bytes(inspectors[addr].name).length > 0;
  }

  /**
   * @dev Actions after accepting an inspection
   */
  function afterAcceptInspection(address addr, uint256 lastInspectionId) public mustBeAllowedCaller {
    markLastInspection(addr, lastInspectionId);

    incrementGiveUps(addr);
  }

  /**
   * @dev Actions after realizing an inspection
   */
  function afterRealizeInspection(address addr) public mustBeAllowedCaller returns (uint256) {
    decreaseGiveUps(addr);

    return incrementInspections(addr);
  }

  /**
   * @dev Increase inspector level and total inspections
   */
  function incrementInspections(address addr) private returns (uint256) {
    inspectors[addr].totalInspections++;

    addLevel(addr);

    return inspectors[addr].totalInspections;
  }

  /**
   * @dev Adds a level to an inspector
   * @param addr Inspector wallet
   */
  function addLevel(address addr) internal {
    Inspector memory inspector = inspectors[addr];
    inspector.pool.level++;
    inspectors[addr] = inspector;

    if (!minimumInspections(inspector.totalInspections)) return;

    inspectorPool.addLevel(addr, 1);
  }

  /**
   * @dev Remove pool levels from inspector
   * @param addr Inspector wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Inspector memory inspector = inspectors[addr];

    if (removeSomeLevels == 0) inspectors[addr].pool.level = 0;
    if (removeSomeLevels > 0) inspectors[addr].pool.level -= removeSomeLevels;

    inspectorPool.removePoolLevels(addr, inspector.pool.currentEra, removeSomeLevels);
  }

  /**
   * @dev Decrement inspections after invalidation
   * @param addr Inspector wallet
   */
  function decrementInspections(address addr) public mustBeAllowedCaller {
    require(inspectors[addr].totalInspections > 0, "totalInspections invalid");

    inspectors[addr].totalInspections--;
  }

  /**
   * @dev Increase inspector give ups
   * @param addr Inspector wallet
   */
  function incrementGiveUps(address addr) private {
    inspectors[addr].giveUps++;
  }

  /**
   * @dev Decrease inspector give ups
   * @param addr Inspector wallet
   */
  function decreaseGiveUps(address addr) private {
    inspectors[addr].giveUps--;
  }

  /**
   * @dev Registers a finished inspection
   * @param addr Inspector wallet
   * @param lastInspectionId Last inspection id
   */
  function markLastInspection(address addr, uint256 lastInspectionId) private {
    inspectors[addr].lastAcceptedAt = block.number;
    inspectors[addr].lastInspection = lastInspectionId;
  }

  /**
   * @dev Current inspectorPool era
   * @return uint256 Return the current contract pool era
   */
  function inspectorPoolEra() internal view returns (uint256) {
    return inspectorPool.currentContractEra();
  }

  /**
   * @dev Call withdraw function to try to claim tokens
   * @notice Withdraw regeneration credit from inspection service provided
   */
  function withdraw() public {
    require(userRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Pool only to inspectors");

    Inspector memory inspector = inspectors[msg.sender];
    require(minimumInspections(inspector.totalInspections), "Minimum inspections");

    uint256 currentEra = inspector.pool.currentEra;

    require(inspectorPool.canWithdraw(currentEra), "Can't approve withdraw");

    inspectors[msg.sender].pool.currentEra++;

    inspectorPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Checks if inspector reached minimum inspections
   * @return bool True if reached
   */
  function minimumInspections(uint256 totalInspections) internal pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTIONS_TO_POOL;
  }

  /**
   * @dev Checkks if an inspector has less than maximum give ups
   * @param addr Inspector wallet
   */
  function isInspectorValid(address addr) public view returns (bool) {
    return inspectors[addr].giveUps < MAX_GIVEUPS;
  }
}
