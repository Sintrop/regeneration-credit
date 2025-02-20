// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

struct Regenerator {
  uint256 id;
  address regeneratorWallet;
  string name;
  string proofPhoto;
  uint256 totalArea;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  RegenerationScore regenerationScore;
  Pool pool;
  uint256 createdAt;
}

struct Pool {
  bool onContractPool;
  uint256 currentEra;
}

struct RegenerationScore {
  uint256 score;
  uint256 average;
  bool sustainable;
}

struct Coordinates {
  string latitude;
  string longitude;
}
