// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Researcher {
  uint256 id;
  address researcherWallet;
  string name;
  Pool pool;
  string proofPhoto;
  uint256 publishedWorks;
  uint256 lastPublishedAt;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}

struct Work {
  uint256 id;
  uint256 era;
  address createdBy;
  string title;
  string thesis;
  string file;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtTimeStamp;
}

struct Penalty {
  uint256 workId;
}
