// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

/**
 * @dev UserTypes of the system
 */
enum UserType {
  UNDEFINED,
  REGENERATOR,
  INSPECTOR,
  RESEARCHER,
  DEVELOPER,
  CONTRIBUTOR,
  ACTIVIST,
  SUPPORTER,
  DENIED
}

/**
 * @dev Delation data structure
 */
struct Delation {
  uint256 id;
  address informer;
  address reported;
  string title;
  string testimony;
}

/**
 * @dev Invitation data structure. This data will create a chain connecting every user to the inviter.
 * @param invited Invited user
 * @param invited Inviter user
 */
struct Invitation {
  address invited;
  address inviter;
  UserType userType;
  uint256 createdAtBlock;
}

/**
 * @dev Settings and configuration of each userType
 * @param proportionalityOnRegister UserType regenerator proportionality
 * @param directProportionalityRegistration Used only by inspectors to follow a proportionality where more inspectors are allowed than regenerators.
 * @param needInvitationOnRegister Bool to check if a userType need invitation to register. False for supporters, true for other users.
 * @param invitationDelayBlocks Amount of blocks that the userType must wait to invite again
 * @param isVoter True if is a voter userType, false if not
 */
struct UserTypeSetting {
  uint256 proportionalityOnRegister;
  bool directProportionalityRegistration;
  bool needInvitationOnRegister;
  uint256 invitationDelayBlocks;
  bool isVoter;
}
