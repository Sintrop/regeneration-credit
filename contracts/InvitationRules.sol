// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ValidationRules } from "./ValidationRules.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @author Sintrop
 * @title InvitationRules
 * @dev Manages the logic to allow users to invite others to the community.
 * @notice This contract manages the rules and logic for users to invite others into the community.
 */
contract InvitationRules is Ownable {

  // --- State Variables ---

  /// @notice Relationship between address and last general invitation blockNumber.
  mapping(address => uint256) public lastInviteBlocks;

  /// @notice Relationship between activist address and last activist invitation blockNumber (for Regenerator/Inspector).
  mapping(address => uint256) public lastInviteActivist;

  /// @notice Maps which UserType (inviter) can invite which other UserTypes (invited).
  /// @dev The key is the inviter's UserType, and the value is a mapping from UserType (invited) to a boolean (true if allowed).
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

  /// @notice ValidationRules contract address
  ValidationRules internal validationRules;

  /// @notice The minimum number of blocks an activist needs to wait to invite Regenerators or Inspectors again.
  uint256 public constant activistDelayBlocks = 1000;

  // --- Constructor ---

  /**
   * @notice Constructor that initializes the addresses of the rule contracts and defines invitation permissions.
   * @dev Ensures that all contract addresses are valid (not null).
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract.
   * @param developerRulesAddress Address of the DeveloperRules contract.
   * @param activistRulesAddress Address of the ActivistRules contract.
   * @param contributorRulesAddress Address of the ContributorRules contract.
   * @param validationRulesAddress Address of the ValidationRules contract.
   */
  constructor(
    address communityRulesAddress,
    address researcherRulesAddress,
    address developerRulesAddress,
    address activistRulesAddress,
    address contributorRulesAddress,
    address validationRulesAddress
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
    developerRules = DeveloperRules(developerRulesAddress);
    activistRules = ActivistRules(activistRulesAddress);
    contributorRules = ContributorRules(contributorRulesAddress);
    validationRules = ValidationRules(validationRulesAddress);

    // Definition of invitation permissions: who can invite whom
    canBeInviteds[UserType.ACTIVIST] = UserType.ACTIVIST;
    canBeInviteds[UserType.INSPECTOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.REGENERATOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.DEVELOPER] = UserType.DEVELOPER;
    canBeInviteds[UserType.RESEARCHER] = UserType.RESEARCHER;
    canBeInviteds[UserType.SUPPORTER] = UserType.SUPPORTER;
    canBeInviteds[UserType.CONTRIBUTOR] = UserType.CONTRIBUTOR;
  }

  // --- Core Logic Functions ---

  /**
   * @dev Allows a user to attempt to invite another wallet to the community.
   * @notice Most active users can invite new users to the system, respecting delay and type rules.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned.
   */
  function invite(address invited, UserType userType) public {
    UserType msgSenderUserType = communityRules.getUser(msg.sender);

    // Checks if the inviter has general permission to send invitations.
    require(canSendInvite(msgSenderUserType), "Only most active users allowed to invite");
    // Checks if the invitation delay for the inviter's type has been reached.
    require(invitationDelayReached(msgSenderUserType), "Invite delay not reached");
    // Checks if the inviter can invite the specified user type.
    require(canBeInviteds[userType] == msgSenderUserType, "Can't invite this type");

    // Updates the last invitation block for the inviter.
    lastInviteBlocks[msg.sender] = block.number;

    // Adds the invitation to the CommunityRules contract.
    communityRules.addInvitation(msg.sender, invited, userType);
  }

  /**
   * @dev Allows an activist to invite Regenerators or Inspectors to the community.
   * @notice Activists can invite Regenerators or Inspectors to the system, respecting the specific activist delay.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned (must be REGENERATOR or INSPECTOR).
   */
  function inviteRegeneratorInspector(address invited, UserType userType) public {
    // Checks if the caller is an activist.
    require(communityRules.userTypeIs(UserType.ACTIVIST, msg.sender), "Only to activists");
    // Checks if the invited user type is Regenerator or Inspector.
    require(userType == UserType.REGENERATOR || userType == UserType.INSPECTOR, "Only regenerators or inspectors");
    // Checks if the specific invitation delay for activists has been reached.
    require(invitationDelayActivist(), "Invite delay not reached");

    // Updates the last activist invitation block for the inviter.
    lastInviteActivist[msg.sender] = block.number;

    // Adds the invitation to the CommunityRules contract.
    communityRules.addInvitation(msg.sender, invited, userType);
  }

  // --- Helper Functions (Internal/View) ---

  /**
   * @dev Based on the inviter userType, this function sends to the correct contract to check if user can invite
   * @param userType Inviter userType
   */
  function canSendInvite(UserType userType) internal view returns (bool) {
    if (userType == UserType.ACTIVIST) {
      return activistRules.canSendInvite(msg.sender);
    } else if (userType == UserType.CONTRIBUTOR) {
      return contributorRules.canSendInvite(msg.sender);
    } else if (userType == UserType.DEVELOPER) {
      return developerRules.canSendInvite(msg.sender);
    } else if (userType == UserType.RESEARCHER) {
      return researcherRules.canSendInvite(msg.sender);
    } else {
      return false;
    }
  }

  /**
   * @dev Calculates if the user has reached the general invitation delay based on their user type.
   * @param userType The user type of the inviter.
   * @return bool True if the user waited the delay blocks, false otherwise.
   */
  function invitationDelayReached(UserType userType) internal view returns (bool) {
    uint256 delayBlocks = communityRules.getUserTypeSettings(userType).invitationDelayBlocks;

    return hasInvitationDelayPassed(lastInviteBlocks[msg.sender], delayBlocks);
  }

  /**
   * @dev Calculates if the activist has reached the specific invitation delay for activists.
   * @return bool True if the activist waited the delay blocks, false otherwise.
   */
  function invitationDelayActivist() internal view returns (bool) {
    return hasInvitationDelayPassed(lastInviteActivist[msg.sender], activistDelayBlocks);
  }

  /**
   * @dev Helper function to calculate if an invitation delay has been met.
   * @param lastInviteBlock The block number of the last invitation.
   * @param delayBlocks The number of blocks that need to be waited.
   * @return bool True if the delay has been met, false otherwise.
   */
  function hasInvitationDelayPassed(uint256 lastInviteBlock, uint256 delayBlocks) internal view returns (bool) {
    return lastInviteBlock == 0 || block.number - lastInviteBlock >= delayBlocks;
  }

  // --- Deploy Functions ---

  /**
   * @dev Allows the contract owner to invite a wallet to the community.
   * @notice The owner can invite any user type without delay or type restrictions.
   * If ownership is renounced, no wallet will be able to call this function.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned.
   */
  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    communityRules.addInvitation(msg.sender, invited, userType);
  }
}
