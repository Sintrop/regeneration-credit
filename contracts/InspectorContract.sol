// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Inspector, Penalty, Pool } from "./types/InspectorTypes.sol";
import { Callable } from "./Callable.sol";
import { UserType } from "./types/UserTypes.sol";
import { InspectorPool } from "./InspectorPool.sol";

/**
 * @title InspectorContract
 * @author Sintrop
 * @dev Manage inspectors rules and data
 * @notice Responsible for collecting producers data
 */
contract InspectorContract is Callable {
  uint256 internal constant MINIMUM_INSPECTIONS_TO_POOL = 3;

  mapping(address => Inspector) internal inspectors;
  mapping(address => Penalty[]) public penalties;

  UserContract internal userContract;
  InspectorPool internal inspectorPool;
  address[] internal inspectorsAddress;
  UserType private constant USER_TYPE = UserType.INSPECTOR;

  uint256 public immutable maxPenalties;
  uint256 private constant MAX_GIVEUPS = 3;

  constructor(address userContractAddress, address inspectorPoolAddress, uint256 maxPenalties_) {
    userContract = UserContract(userContractAddress);
    inspectorPool = InspectorPool(inspectorPoolAddress);
    maxPenalties = maxPenalties_;
  }

  /**
   * @dev Allow a new registration of inspector
   * @param name the name of the inspector
   * @return a Inspector
   */
  function addInspector(string memory name, string memory proofPhoto) public returns (Inspector memory) {
    Inspector memory inspector = Inspector(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      name,
      proofPhoto,
      0,
      0,
      0,
      0,
      Pool(0, inspectorPoolEra())
    );

    inspectors[msg.sender] = inspector;
    inspectorsAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);

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
   * @dev Returns all registered inspectors
   * @return Inspector struct array
   */
  function getInspectors() public view returns (Inspector[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Inspector[] memory inspectorList = new Inspector[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = inspectorsAddress[i];
      inspectorList[i] = inspectors[acAddress];
    }

    return inspectorList;
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

  function afterAcceptInspection(address addr, uint256 lastInspectionId) public mustBeAllowedCaller {
    markLastInspection(addr, lastInspectionId);

    incrementGiveUps(addr);
  }

  function afterRealizeInspection(address addr) public mustBeAllowedCaller returns (uint256) {
    decreaseGiveUps(addr);

    return incrementInspections(addr);
  }

  function incrementInspections(address addr) private returns (uint256) {
    inspectors[addr].totalInspections++;

    addLevel(addr);

    return inspectors[addr].totalInspections;
  }

  function addLevel(address addr) internal {
    Inspector memory inspector = inspectors[addr];
    inspector.pool.level++;
    inspectors[addr] = inspector;

    if (!minimumInspections(inspector.totalInspections)) return;

    inspectorPool.addLevel(addr, 1, 1);
  }

  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Inspector memory inspector = inspectors[addr];

    if (removeSomeLevels == 0) inspectors[addr].pool.level = 0;
    if (removeSomeLevels > 0) inspectors[addr].pool.level -= removeSomeLevels;

    inspectorPool.removePoolLevels(addr, inspector.pool.currentEra, removeSomeLevels);
  }

  function decrementInspections(address addr) public mustBeAllowedCaller {
    require(inspectors[addr].totalInspections > 0, "totalInspections invalid");

    inspectors[addr].totalInspections--;
  }

  function incrementGiveUps(address addr) private {
    inspectors[addr].giveUps++;
  }

  function decreaseGiveUps(address addr) private {
    inspectors[addr].giveUps--;
  }

  function markLastInspection(address addr, uint256 lastInspectionId) private {
    inspectors[addr].lastAcceptedAt = block.number;
    inspectors[addr].lastInspection = lastInspectionId;
  }

  function inspectorPoolEra() internal view returns (uint256) {
    return inspectorPool.currentContractEra();
  }

  function withdraw() public {
    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Pool only to inspectors");

    Inspector memory inspector = inspectors[msg.sender];
    require(minimumInspections(inspector.totalInspections), "Minimum inspections");

    uint256 currentEra = inspector.pool.currentEra;

    require(inspectorPool.canWithdraw(currentEra), "Can't approve withdraw");

    inspectors[msg.sender].pool.currentEra++;

    inspectorPool.withdraw(msg.sender, currentEra);
  }

  function minimumInspections(uint256 totalInspections) internal pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTIONS_TO_POOL;
  }

  function isInspectorValid(address addr) public view returns (bool) {
    return inspectors[addr].giveUps < MAX_GIVEUPS;
  }
}
