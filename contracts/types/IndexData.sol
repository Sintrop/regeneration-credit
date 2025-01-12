// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

struct Category {
  uint256 id;
  string name;
  string description;
}

struct RegenerationIndexDescription {
  uint256 regenerationIndexId;
  string description;
}

struct RegenerationIndex {
  string name;
  int256 value;
}
