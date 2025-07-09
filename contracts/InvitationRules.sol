// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IResearcherRules } from "./interfaces/IResearcherRules.sol";
import { IDeveloperRules } from "./interfaces/IDeveloperRules.sol";
import { IActivistRules } from "./interfaces/IActivistRules.sol";
import { IContributorRules } from "./interfaces/IContributorRules.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @title InvitationRules
 * @author Sintrop
 * @dev Manages the logic to allow users to invite others to the community.
 * @notice This contract manages the rules and logic for users to invite others into the community.
 */
contract InvitationRules is Ownable {
  // --- Constants ---

  /// @notice The maximum allowed amount of invalidated invited users.
  uint16 private constant MAX_INVITER_PENALTIES = 5;

  /// @notice The maximum allowed amount of invalidated invited users for activists.
  uint16 private constant MAX_ACTIVIST_PENALTIES = 10;

  /// @notice The minimum number of blocks an activist needs to wait to invite Regenerators or Inspectors again.
  uint16 public constant ACTIVIST_DELAY_BLOCKS = 500;

  // --- State variables ---

  /// @notice Relationship between address and last general invitation blockNumber.
  mapping(address => uint256) public lastInviteBlocks;

  /// @notice Relationship between activist address and last activist invitation blockNumber (for Regenerator/Inspector).
  mapping(address => uint256) public lastInviteActivist;

  /// @notice Maps which UserType (inviter) can invite which other UserTypes (invited).
  /// @dev The key is the inviter's UserType, and the value is a mapping from UserType (invited) to a boolean (true if allowed).
  mapping(UserType => UserType) public canBeInviteds;

  /// @notice CommunityRules contract address
  ICommunityRules private communityRules;

  /// @notice ResearcherRules contract address
  IResearcherRules private researcherRules;

  /// @notice DeveloperRules contract address
  IDeveloperRules private developerRules;

  /// @notice ActivistRules contract address
  IActivistRules private activistRules;

  /// @notice ContributorRules contract address
  IContributorRules private contributorRules;

  // --- Constructor ---

  /**
   * @notice Constructor that initializes the addresses of the rule contracts and defines invitation permissions.
   * @dev Ensures that all contract addresses are valid (not null).
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract.
   * @param developerRulesAddress Address of the DeveloperRules contract.
   * @param activistRulesAddress Address of the ActivistRules contract.
   * @param contributorRulesAddress Address of the ContributorRules contract.
   */
  constructor(
    address communityRulesAddress,
    address researcherRulesAddress,
    address developerRulesAddress,
    address activistRulesAddress,
    address contributorRulesAddress
  ) {
    communityRules = ICommunityRules(communityRulesAddress);
    researcherRules = IResearcherRules(researcherRulesAddress);
    developerRules = IDeveloperRules(developerRulesAddress);
    activistRules = IActivistRules(activistRulesAddress);
    contributorRules = IContributorRules(contributorRulesAddress);

    // Definition of invitation permissions: who can invite whom
    canBeInviteds[UserType.ACTIVIST] = UserType.ACTIVIST;
    canBeInviteds[UserType.INSPECTOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.REGENERATOR] = UserType.ACTIVIST;
    canBeInviteds[UserType.DEVELOPER] = UserType.DEVELOPER;
    canBeInviteds[UserType.RESEARCHER] = UserType.RESEARCHER;
    canBeInviteds[UserType.SUPPORTER] = UserType.SUPPORTER;
    canBeInviteds[UserType.CONTRIBUTOR] = UserType.CONTRIBUTOR;
  }

  // --- Public functions ---

  /**
   * @dev Allows a user to attempt to invite another wallet to the community.
   * @notice Most active users can invite new users to the system, respecting delay and type rules.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned.
   */
  function invite(address invited, UserType userType) public {
    require(communityRules.inviterPenalties(msg.sender) < MAX_INVITER_PENALTIES, "Too many penalties");

    UserType msgSenderUserType = communityRules.getUser(msg.sender);

    // Checks if the inviter has general permission to send invitations.
    require(_canSendInvite(msgSenderUserType), "Only most active users allowed to invite");
    // Checks if the invitation delay for the inviter's type has been reached.
    require(_invitationDelayReached(msgSenderUserType), "Invite delay not reached");
    // Checks if the inviter can invite the specified user type.
    require(canBeInviteds[userType] == msgSenderUserType, "Can't invite this type");

    // Updates the last invitation block for the inviter.
    lastInviteBlocks[msg.sender] = block.number;

    // Adds the invitation to the CommunityRules contract.
    communityRules.addInvitation(msg.sender, invited, userType);

    // Emits an event to log the invitation.
    emit UserInvited(msg.sender, invited, userType, block.number);
  }

  /**
   * @dev Allows an activist to invite Regenerators or Inspectors to the community.
   * @notice Activists can invite Regenerators or Inspectors to the system, respecting the specific activist delay.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned (must be REGENERATOR or INSPECTOR).
   */
  function inviteRegeneratorInspector(address invited, UserType userType) public {
    require(communityRules.inviterPenalties(msg.sender) < MAX_ACTIVIST_PENALTIES, "Too many penalties");
    // Checks if the caller is an activist.
    require(communityRules.userTypeIs(UserType.ACTIVIST, msg.sender), "Only to activists");
    // Checks if the invited user type is Regenerator or Inspector.
    require(userType == UserType.REGENERATOR || userType == UserType.INSPECTOR, "Only regenerators or inspectors");
    // Checks if the specific invitation delay for activists has been reached.
    require(_invitationDelayActivist(), "Invite delay not reached");

    // Updates the last activist invitation block for the inviter.
    lastInviteActivist[msg.sender] = block.number;

    // Adds the invitation to the CommunityRules contract.
    communityRules.addInvitation(msg.sender, invited, userType);

    // Emits an event to log the invitation.
    emit UserInvited(msg.sender, invited, userType, block.number);
  }

  // --- Private functions ---

  /**
   * @dev Based on the inviter userType, this function sends to the correct contract to check if user can invite.
   * @param userType Inviter userType.
   */
  function _canSendInvite(UserType userType) private view returns (bool) {
    if (userType == UserType.ACTIVIST) {
      return activistRules.canSendInvite(msg.sender);
    } else if (userType == UserType.CONTRIBUTOR) {
      return contributorRules.canSendInvite(msg.sender);
    } else if (userType == UserType.DEVELOPER) {
      return developerRules.canSendInvite(msg.sender);
    } else if (userType == UserType.RESEARCHER) {
      return researcherRules.canSendInvite(msg.sender);
    } else if (userType == UserType.SUPPORTER) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev Calculates if the user has reached the general invitation delay based on their user type.
   * @param userType The user type of the inviter.
   * @return bool True if the user waited the delay blocks, false otherwise.
   */
  function _invitationDelayReached(UserType userType) private view returns (bool) {
    uint32 delayBlocks = communityRules.getUserTypeSettings(userType).invitationDelayBlocks;

    return _hasInvitationDelayPassed(lastInviteBlocks[msg.sender], delayBlocks);
  }

  /**
   * @dev Calculates if the activist has reached the specific invitation delay for activists.
   * @return bool True if the activist waited the delay blocks, false otherwise.
   */
  function _invitationDelayActivist() private view returns (bool) {
    return _hasInvitationDelayPassed(lastInviteActivist[msg.sender], ACTIVIST_DELAY_BLOCKS);
  }

  /**
   * @dev Helper function to calculate if an invitation delay has been met.
   * @param lastInviteBlock The block number of the last invitation.
   * @param delayBlocks The number of blocks that need to be waited.
   * @return bool True if the delay has been met, false otherwise.
   */
  function _hasInvitationDelayPassed(uint256 lastInviteBlock, uint32 delayBlocks) private view returns (bool) {
    return lastInviteBlock == 0 || block.number - lastInviteBlock >= delayBlocks;
  }

  // --- Deploy functions ---

  /**
   * @dev Allows the contract owner to invite a wallet to the community.
   * @notice The owner can invite any user type without delay or type restrictions.
   * If ownership is renounced, no wallet will be able to call this function.
   * @param invited The address of the wallet to be invited.
   * @param userType The user type to which the invited user will be assigned.
   */
  function onlyOwnerInvite(address invited, UserType userType) public onlyOwner {
    communityRules.addInvitation(msg.sender, invited, userType);
    // Emits an event to log the invitation.
    emit UserInvited(msg.sender, invited, userType, block.number);
  }

  // --- Events ---

  /// @notice Event emitted when a user invites another.
  /// @param inviter The address of the user who made the invitation.
  /// @param invited The address of the invited user.
  /// @param invitedType The user type assigned to the invited user.
  /// @param blockNumber The block number at which the invitation was made.
  event UserInvited(address indexed inviter, address indexed invited, UserType invitedType, uint256 blockNumber);
}
