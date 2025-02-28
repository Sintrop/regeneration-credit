// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ValidatorRules } from "./ValidatorRules.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @author Sintrop
 * @title InvitationRules
 * @dev Manage logic to allow users invite others
 */
contract InvitationRules is Ownable {

  /// @notice Relationship between address and last invitation blockNumber
  mapping(address => uint256) public lastInviteBlocks;

  /// @notice Relationship between which userType can invite who
  mapping(UserType => UserType) public canBeInviteds;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ResearcherRules contract address
  ResearcherRules internal researcherRules;

  /// @notice DeveloperRules contract address
  DeveloperRules internal developerRules;

  /// @notice ActivistRules contract address
  ActivistRules internal activistRules;

  /// @notice ContributorRules contract address
  ContributorRules internal contributorRules;

  /// @notice ValidatorRules contract address
  ValidatorRules internal validatorRules;

  constructor(
    address communityRulesAddress,
    address researcherRulesAddress,
    address developerRulesAddress,
    address activistRulesAddress,
    address contributorRulesAddress,
    address validatorRulesAddress
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
    developerRules = DeveloperRules(developerRulesAddress);
    activistRules = ActivistRules(activistRulesAddress);
    contributorRules = ContributorRules(contributorRulesAddress);
    validatorRules = ValidatorRules(validatorRulesAddress);

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
    UserType msgSenderUserType = communityRules.getUser(msg.sender);

    require(canSendInvite(msgSenderUserType), "Only most active users allowed to invite");
    require(invitationDelayReached(msgSenderUserType), "Invite delay not reached");
    require(canBeInviteds[userType] == msgSenderUserType, "Can't invite this type");

    lastInviteBlocks[msg.sender] = block.number;

    communityRules.addInvitation(msg.sender, invited, userType);
  }

  function canSendInvite(UserType userType) internal view returns (bool) {
    if (userType == UserType.ACTIVIST) {
      return activistRules.canSendInvite(msg.sender);
    } else if (userType == UserType.CONTRIBUTOR) {
      return contributorRules.canSendInvite(msg.sender);
    } else if (userType == UserType.DEVELOPER) {
      return developerRules.canSendInvite(msg.sender);
    } else if (userType == UserType.RESEARCHER) {
      return researcherRules.canSendInvite(msg.sender);
    } else if (userType == UserType.VALIDATOR) {
      return validatorRules.canSendInvite(msg.sender);
    } else {
      return true;
    }
  }

  /**
   * @dev Allows owner to invite another wallet to the community
   * @param invited Invited address
   * @param userType Invited type
   */
  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    communityRules.addInvitation(msg.sender, invited, userType);
  }

  /**
   * @dev Calculate if user reached invitation delay
   * @param userType Invited type
   * @return bool True if user waited delay blocks
   */
  function invitationDelayReached(UserType userType) internal view returns (bool) {
    uint256 delayBlocks = communityRules.getUserTypeSettings(userType).invitationDelayBlocks;

    return lastInviteBlocks[msg.sender] <= 0 || block.number - lastInviteBlocks[msg.sender] >= delayBlocks;
  }
}
