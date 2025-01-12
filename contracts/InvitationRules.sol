// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserRules } from "./UserRules.sol";
import { UserType } from "./types/UserTypes.sol";

/**
 * @author Sintrop
 * @title InvitationRules
 * @dev Manage logic to allow users invite others
 */
contract InvitationRules is Ownable {
  mapping(address => uint256) public lastInviteBlocks;
  mapping(UserType => UserType) public canBeInviteds;

  UserRules internal userContract;

  constructor(address userContractAddress) {
    userContract = UserRules(userContractAddress);

    canBeInviteds[UserType.ACTIVIST] = UserType.ACTIVIST;
    canBeInviteds[UserType.INSPECTOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.REGENERATOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.DEVELOPER] = UserType.DEVELOPER;
    canBeInviteds[UserType.RESEARCHER] = UserType.RESEARCHER;
    canBeInviteds[UserType.SUPPORTER] = UserType.SUPPORTER;
    canBeInviteds[UserType.CONTRIBUTOR] = UserType.CONTRIBUTOR;
    canBeInviteds[UserType.VALIDATOR] = UserType.VALIDATOR;
  }

  /**
   * @dev Allows a user to attempt to invite another wallet to the community
   * @param invited Invited address
   * @param userType Invited type
   */
  function invite(address invited, UserType userType) public {
    UserType msgSenderUserType = userContract.getUser(msg.sender);

    require(invitationDelayReached(msgSenderUserType), "Invite delay not reached");
    require(canBeInviteds[userType] == msgSenderUserType, "can't invite this type");

    lastInviteBlocks[msg.sender] = block.number;

    userContract.addInvitation(msg.sender, invited, userType);
  }

  /**
   * @dev Allows owner to invite another wallet to the community
   * @param invited Invited address
   * @param userType Invited type
   */
  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    userContract.addInvitation(msg.sender, invited, userType);
  }

  /**
   * @dev Calculate if user reached invitation delay
   * @param userType Invited type
   * @return bool True if user waited delay blocks
   */
  function invitationDelayReached(UserType userType) internal view returns (bool) {
    uint256 delayBlocks = userContract.getUserTypeSettings(userType).invitationDelayBlocks;

    return lastInviteBlocks[msg.sender] <= 0 || block.number - lastInviteBlocks[msg.sender] >= delayBlocks;
  }
}
