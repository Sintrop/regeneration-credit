// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Producer {
  uint256 id;
  address producerWallet;
  string name;
  string proofPhoto;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  RegenerationScore regenerationScore;
  AreaInformation areaInformation;
  Pool pool;
}

struct Pool {
  bool onContractPool;
  uint256 currentEra;
}

struct RegenerationScore {
  int256 score;
  int256 average;
  bool sustainable;
}

struct AreaInformation {
  string coordinates;
  uint256 totalArea;
}
