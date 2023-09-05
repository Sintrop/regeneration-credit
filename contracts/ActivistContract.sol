// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Activist } from "./types/ActivistTypes.sol";
import { Registrable } from "./Registrable.sol";
import { UserType } from "./types/UserTypes.sol";

contract ActivistContract is Registrable {
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
   * @return a Activist
   */
  function addActivist(
    string memory name,
    string memory proofPhoto
  ) public mustBeAllowedUser uniqueActivist returns (Activist memory) {
    uint256 id = activistsCount + 1;
    UserType userType = UserType.ACTIVIST;

    Activist memory activist = Activist(id, msg.sender, userType, name, proofPhoto);

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

  // MODIFIERS

  modifier uniqueActivist() {
    require(!activistExists(msg.sender), "This activist already exist");
    _;
  }
}
