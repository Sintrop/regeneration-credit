// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

library CommunityTypes {
  /**
   * @dev UserTypes of the system.
   * @notice Summary of User Roles:
   *
   * Regenerator: Core users providing terrestrial ecosystem regeneration services by
   * registering and managing a regeneration area.
   *
   * Inspector: Responsible for decentralized data collection and verification of
   * Regenerators' activities, such as counting trees and assessing biodiversity.
   *
   * Researcher: Responsible for environmental research, developing evaluation methodologies, and
   * creating impact calculator items.
   *
   * Developer: Responsible for the technical development of the system, including
   * smart contracts, front-end interfaces, and related applications.
   *
   * Activist: Empowered to invite new Regenerators and Inspectors into the system,
   * expanding the community's reach.
   *
   * Contributor: A generic contribution user who can provide community support,
   * translations, design, and any other general functions that benefit the project.
   *
   * Supporter: Any individual or organization, who can finance regeneration by
   * purchasing tokens from users and then burning them to receive an offset certificate.
   */
  enum UserType {
    UNDEFINED,
    REGENERATOR,
    INSPECTOR,
    RESEARCHER,
    DEVELOPER,
    CONTRIBUTOR,
    ACTIVIST,
    SUPPORTER
  }

  /**
   * @dev Struct representing a delation against a user or a resource.
   * These delations are intended to be filed due to unwanted behavior or non-compliance.
   * @param id A unique identifier for this specific delation.
   * @param informer The address of the user who submitted the delation.
   * @param reported The address of the user or resource being reported against.
   * @param title A brief title or summary of the delation.
   * @param testimony Detailed justification and evidence for the delation.
   * @param createdAtBlock The block number at which the delation was issued.
   * @param thumbsUp Number of true votes.
   * @param thumbsDown Number of false votes.
   */
  struct Delation {
    uint64 id;
    address informer;
    address reported;
    string title;
    string testimony;
    uint256 createdAtBlock;
    uint256 thumbsUp;
    uint256 thumbsDown;
  }

  /**
   * @dev Struct representing an invitation for a user to join the system as a specific `UserType`.
   * This data forms a chain connecting every invited user to their inviter.
   * @param invited The address of the user who received this invitation.
   * @param inviter The address of the user who issued this invitation.
   * @param userType The `UserType` the `invited` user is intended to register as.
   * @param createdAtBlock The block number at which this invitation was issued.
   */
  struct Invitation {
    address invited;
    address inviter;
    UserType userType;
    uint256 createdAtBlock;
  }

  /**
   * @dev Struct containing configuration settings and rules for each `UserType`.
   * These settings define behavior related to registration proportionality, invitation requirements, and voting status.
   * @param proportionalityOnRegister Defines a numerical ratio used in proportionality rules for user registration.
   * For example, a value of 2 mean a maximum of 2 units of this user type per 1 unit of a the Regenerator base user type.
   * A value of 0 typically means no proportionality limit.
   * @param directProportionalityRegistration `true` if proportionality is applied via direct multiplication
   * (e.g., max this type = base type * ratio). `false` implies inverse division (e.g., max this type = base type / ratio).
   * This field is used to adapt proportionality logic, particularly for Inspectors.
   * @param needInvitationOnRegister `true` if a user of this `UserType` requires a valid invitation to register.
   * `false` for user types that can register without an invitation (e.g., Supporters).
   * @param invitationDelayBlocks The minimum number of blocks that a user of this `UserType` must wait
   * after inviting someone before they can issue another invitation. A value of 0 means no delay.
   * @param isVoter `true` if users of this `UserType` are voters in the system's validation processes.
   * `false` otherwise.
   */
  struct UserTypeSetting {
    uint8 proportionalityOnRegister;
    bool directProportionalityRegistration;
    bool needInvitationOnRegister;
    uint32 invitationDelayBlocks;
    bool isVoter;
  }
}
