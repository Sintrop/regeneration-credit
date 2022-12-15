// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Researcher {
  uint256 id;
  address researcherWallet;
  UserType userType;
  string name;
  string proofPhoto;
  uint256 publishedWorks;
}

struct Work {
  uint256 id;
  address createdBy;
  string title;
  string thesis;
  string file;
  uint256 createdAt;
}
