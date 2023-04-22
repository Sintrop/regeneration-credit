// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/ActivistTypes.sol";
import "./Callable.sol";

contract ActivistContract is Callable {
  mapping(address => Activist) internal activists;

  UserContract internal userContract;
  address[] internal activistsAddress;
  uint256 public activistsCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
  }

  /**
   * @dev Allow a new register of activist
   * @param name the name of the activist
   * @param coordinate the coordinate of the activist
   * @return a Activist
   */
  // TODO Add mustBeAllowedCaller
  function addActivist(
    string memory name,
    string memory proofPhoto,
    string memory coordinate
  ) public uniqueActivist returns (Activist memory) {
    uint256 id = activistsCount + 1;
    UserType userType = UserType.ACTIVIST;

    ActivistAddress memory activistAddress = ActivistAddress(coordinate);

    Activist memory activist = Activist(id, msg.sender, userType, name, proofPhoto, 0, 0, activistAddress, 0);

    activists[msg.sender] = activist;
    activistsAddress.push(msg.sender);
    activistsCount++;
    userContract.addUser(msg.sender, userType);

    return activist;
  }

  /**
   * @dev Returns all registered activists
   * @return Activist struct array
   */
  function getActivists() public view returns (Activist[] memory) {
    Activist[] memory activistList = new Activist[](activistsCount);

    for (uint256 i = 0; i < activistsCount; i++) {
      address acAddress = activistsAddress[i];
      activistList[i] = activists[acAddress];
    }

    return activistList;
  }

  /**
   * @dev Return a specific activist
   * @param addr the address of the activist.
   */
  function getActivist(address addr) public view returns (Activist memory) {
    return activists[addr];
  }

  /**
   * @dev Check if a specific activist exists
   * @return a bool that represent if a activist exists or not
   */
  function activistExists(address addr) public view returns (bool) {
    return bytes(activists[addr].name).length > 0;
  }

  function incrementRequests(address addr) public mustBeAllowedCaller {
    activists[addr].totalInspections++;
  }

  function incrementGiveUps(address addr) public mustBeAllowedCaller {
    activists[addr].giveUps++;
  }

  function decreaseGiveUps(address addr) public mustBeAllowedCaller {
    activists[addr].giveUps--;
  }

  function lastAcceptedAt(address addr, uint256 blocksNumber) public mustBeAllowedCaller {
    activists[addr].lastAcceptedAt = blocksNumber;
  }

  // MODIFIERS

  modifier uniqueActivist() {
    require(!activistExists(msg.sender), "This activist already exist");
    _;
  }
}
