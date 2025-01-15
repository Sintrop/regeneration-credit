// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./UserTypes.sol";

struct Inspector {
  uint256 id;
  address inspectorWallet;
  string name;
  string proofPhoto;
  uint256 totalInspections;
  uint256 giveUps;
  uint256 lastAcceptedAt;
  uint256 lastInspection;
  Pool pool;
}

struct Penalty {
  uint256 inspectionId;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}
