// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

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

struct Delation {
  uint256 id;
  address informer;
  address reported;
  string title;
  string testimony;
}

struct Invitation {
  address invited;
  address inviter;
  UserType userType;
  uint256 createdAtBlock;
}

struct UserTypeSetting {
  uint256 proportionalityOnRegister;
  bool directProportionalityRegistration;
  bool needInvitationOnRegister;
  uint256 invitationDelayBlocks;
  bool isVoter;
}
