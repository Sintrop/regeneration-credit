// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @title InvitationContract
 * @dev Invited resource that allow invite users
 */
contract InvitationContract is Ownable {
  mapping(address => uint256) public lastInviteBlocks;
  mapping(UserType => UserType) public canBeInviteds;

  UserContract internal userContract;

  address[] internal developersAddress;
  uint256 public developersCount;
  uint256 public immutable inviteDelayBlocks;

  constructor(address userContractAddress, uint256 _inviteDelayBlocks) {
    userContract = UserContract(userContractAddress);
    inviteDelayBlocks = _inviteDelayBlocks;

    canBeInviteds[UserType.ACTIVIST] = UserType.ACTIVIST;
    canBeInviteds[UserType.INSPECTOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.PRODUCER] = UserType.ACTIVIST;
    canBeInviteds[UserType.DEVELOPER] = UserType.DEVELOPER;
    canBeInviteds[UserType.RESEARCHER] = UserType.RESEARCHER;
    canBeInviteds[UserType.SUPPORTER] = UserType.SUPPORTER;
  }

  function invite(address invited, UserType userType) public {
    require(block.number - lastInviteBlocks[msg.sender] >= inviteDelayBlocks, "Invite delay not reached");
    require(canBeInviteds[userType] == userContract.getUser(msg.sender), "can't invite this type");

    userContract.addInvitation(msg.sender, invited, userType);
  }

  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    userContract.addInvitation(msg.sender, invited, userType);
  }
}
