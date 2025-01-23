// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Activist {
  uint256 id;
  address activistWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 createdAt;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}
