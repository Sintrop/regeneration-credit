// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum UserType {
  UNDEFINED,
  PRODUCER,
  INSPECTOR,
  RESEARCHER,
  DEVELOPER,
  ADVISOR,
  ACTIVIST,
  INVESTOR,
  VALIDATOR,
  DENIED
}

struct Delation {
  uint256 id;
  address informer;
  address reported;
  string title;
  string testimony;
  string proofPhoto;
}
