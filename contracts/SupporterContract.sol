// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Supporter } from "./types/SupporterTypes.sol";
import { UserType } from "./types/UserTypes.sol";

contract SupporterContract {
  mapping(address => Supporter) internal supporters;

  UserContract internal userContract;
  address[] internal supportersAddress;
  uint256 public supportersCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
  }

  /**
   * @dev Allow a new register of supporter
   * @param name the name of the supporter
   * @return a supporter
   */
  function addSupporter(string memory name) public uniqueSupporter returns (Supporter memory) {
    uint256 id = supportersCount + 1;
    UserType userType = UserType.SUPPORTER;

    Supporter memory supporter = Supporter(id, msg.sender, userType, name);

    supporters[msg.sender] = supporter;
    supportersAddress.push(msg.sender);
    supportersCount++;
    userContract.addUser(msg.sender, userType);

    return supporter;
  }

  /**
   * @dev Returns all registered supporters
   * @return Supporter struct array
   */
  function getSupporters() public view returns (Supporter[] memory) {
    Supporter[] memory supporterList = new Supporter[](supportersCount);

    for (uint256 i = 0; i < supportersCount; i++) {
      address acAddress = supportersAddress[i];
      supporterList[i] = supporters[acAddress];
    }

    return supporterList;
  }

  /**
   * @dev Return a specific supporter
   * @param addr the address of the supporter.
   */
  function getSupporter(address addr) public view returns (Supporter memory) {
    return supporters[addr];
  }

  /**
   * @dev Check if a specific supporter exists
   * @return a bool that represent if a supporter exists or not
   */
  function supporterExists(address addr) public view returns (bool) {
    return bytes(supporters[addr].name).length > 0;
  }

  //MODIFIERS

  modifier uniqueSupporter() {
    require(!supporterExists(msg.sender), "This supporter already exist");
    _;
  }
}
