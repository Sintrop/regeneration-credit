// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./UserData.sol";

struct Contributor {
  uint256 id;
  address contributorWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 createdAt;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}

struct Contribution {
  uint256 id;
  uint256 era;
  address user;
  uint256 level;
  string report;
  uint256 createdAtBlockNumber;
}
