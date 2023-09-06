// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Inspector, InspectorAddress, Pool} from "./types/InspectorTypes.sol";
import { Callable } from "./Callable.sol";
import { UserType } from "./types/UserTypes.sol";
import { InspectorPool } from "./InspectorPool.sol";

contract InspectorContract is Callable {
  mapping(address => Inspector) internal inspectors;

  UserContract internal userContract;
  address[] internal inspectorsAddress;
  uint256 public inspectorsCount;
  InspectorPool internal inspectorPool;

  constructor(address userContractAddress, address inspectorPoolAddress) {
    userContract = UserContract(userContractAddress);
    inspectorPool = InspectorPool(inspectorPoolAddress);
  }

  /**
   * @dev Allow a new register of inspector
   * @param name the name of the inspector
   * @param coordinate the coordinate of the inspector
   * @return a Inspector
   */
  // TODO Add mustBeAllowedCaller
  function addInspector(
    string memory name,
    string memory proofPhoto,
    string memory coordinate
  ) public uniqueInspector returns (Inspector memory) {
    uint256 id = inspectorsCount + 1;
    UserType userType = UserType.INSPECTOR;

    InspectorAddress memory inspectorAddress = InspectorAddress(coordinate);

    uint256 currentEra = inspectorPoolEra();
    Pool memory pool = Pool(0, currentEra);

    Inspector memory inspector = Inspector(id, msg.sender, userType, name, proofPhoto, 0, 0, inspectorAddress, 0, pool);

    inspectors[msg.sender] = inspector;
    inspectorsAddress.push(msg.sender);
    inspectorsCount++;
    userContract.addUser(msg.sender, userType);

    return inspector;
  }

  /**
   * @dev Returns all registered inspectors
   * @return Inspector struct array
   */
  function getInspectors() public view returns (Inspector[] memory) {
    Inspector[] memory inspectorList = new Inspector[](inspectorsCount);

    for (uint256 i = 0; i < inspectorsCount; i++) {
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

  function incrementRequests(address addr) public mustBeAllowedCaller {
    inspectors[addr].totalInspections++;
  }

  function incrementGiveUps(address addr) public mustBeAllowedCaller {
    inspectors[addr].giveUps++;
  }

  function decreaseGiveUps(address addr) public mustBeAllowedCaller {
    inspectors[addr].giveUps--;
  }

  function lastAcceptedAt(address addr, uint256 blocksNumber) public mustBeAllowedCaller {
    inspectors[addr].lastAcceptedAt = blocksNumber;
  }

  function inspectorPoolEra() internal view returns (uint256) {
    return inspectorPool.currentContractEra();
  }  

  // MODIFIERS

  modifier uniqueInspector() {
    require(!inspectorExists(msg.sender), "This inspector already exist");
    _;
  }
}
