// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./UserTypes.sol";

struct Developer {
  uint256 id;
  address developerWallet;
  UserType userType;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 totalContributions;
  uint256 createdAt;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}

struct Contribution {
  uint256 id;
  uint256 era;
  address developer;
  uint256 level;
  string report;
  uint256 validationsCount;
  bool contributed;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlockNumber;
}

struct Penalty {
  uint256 contributionId;
}
