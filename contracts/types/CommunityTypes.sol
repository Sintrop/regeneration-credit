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
  VALIDATOR,
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
 * @dev Invitation data structure
 */
struct Invitation {
  address invited;
  address inviter;
  UserType userType;
  uint256 createdAtBlock;
}

/**
 * @dev Settings and configuration of each userType
 */
struct UserTypeSetting {
  uint256 proportionalityOnRegister;
  bool directProportionalityRegistration;
  bool needInvitationOnRegister;
  uint256 invitationDelayBlocks;
  bool isVoter;
}
