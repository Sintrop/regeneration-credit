// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Supporter {
  uint256 id;
  address supporterWallet;
  string name;
  uint256 createdAt;
}

struct Publication {
  uint256 amount;
  string description;
  string content;
}