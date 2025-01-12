// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { Supporter } from "./types/SupporterTypes.sol";
import { UserType, Invitation } from "./types/UserTypes.sol";
import { SupporterPool } from "./SupporterPool.sol";

/**
 * @author Sintrop
 * @title SupporterRules
 * @dev Manage supporters rules and data
 * @notice Burn tokens to compensate your degradation
 */
contract SupporterRules {
  mapping(address => Supporter) internal supporters;

  UserRules internal userContract;
  SupporterPool internal supporterPool;
  address[] internal supportersAddress;
  UserType private constant USER_TYPE = UserType.SUPPORTER;

  constructor(address userContractAddress, address supporterPoolAddress) {
    userContract = UserRules(userContractAddress);
    supporterPool = SupporterPool(supporterPoolAddress);
  }

  /**
   * @dev Allow new register of supporter
   * @param name the name of the supporter
   * @return a supporter
   */
  function addSupporter(string memory name) public returns (Supporter memory) {
    Supporter memory supporter = Supporter(userContract.userTypesCount(USER_TYPE) + 1, msg.sender, name);

    supporters[msg.sender] = supporter;
    supportersAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);

    return supporter;
  }

  function burnTokens(uint256 amount) public {
    require(userContract.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 0, "Amount invalid");

    Invitation memory invitation = userContract.getInvitation(msg.sender);
    bool isInvited = invitation.createdAtBlock != 0;

    supporterPool.burnTokens(msg.sender, invitation.inviter, amount, isInvited);
  }

  /**
   * @dev Returns all registered supporters
   * @return Supporter struct array
   */
  function getSupporters() public view returns (Supporter[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Supporter[] memory supporterList = new Supporter[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
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
}
