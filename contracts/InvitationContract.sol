// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";

/**
 * @title InvitationContract
 * @dev Invited resource that allow invite users
 */
contract InvitationContract is Ownable {
  mapping(address => uint256) public lastInviteBlocks;
  mapping(UserType => UserType) public canBeInviteds;

  UserContract internal userContract;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);

    canBeInviteds[UserType.ACTIVIST] = UserType.ACTIVIST;
    canBeInviteds[UserType.INSPECTOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.PRODUCER] = UserType.ACTIVIST;
    canBeInviteds[UserType.DEVELOPER] = UserType.DEVELOPER;
    canBeInviteds[UserType.RESEARCHER] = UserType.RESEARCHER;
    canBeInviteds[UserType.SUPPORTER] = UserType.SUPPORTER;
    canBeInviteds[UserType.CONTRIBUTOR] = UserType.CONTRIBUTOR;
    canBeInviteds[UserType.VALIDATOR] = UserType.VALIDATOR;
  }

  function invite(address invited, UserType userType) public {
    UserType msgSenderUserType = userContract.getUser(msg.sender);

    require(invitationDelayReached(msgSenderUserType), "Invite delay not reached");
    require(canBeInviteds[userType] == msgSenderUserType, "can't invite this type"); // Adicionar specs para essa validação

    lastInviteBlocks[msg.sender] = block.number;

    userContract.addInvitation(msg.sender, invited, userType);
  }

  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    userContract.addInvitation(msg.sender, invited, userType);
  }

  function invitationDelayReached(UserType userType) internal view returns (bool) {
    uint256 delayBlocks = userContract.getUserTypeSettings(userType).invitationDelayBlocks;

    return lastInviteBlocks[msg.sender] <= 0 || block.number - lastInviteBlocks[msg.sender] >= delayBlocks;
  }
}
