// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

/**
 * @dev RegenerationIndex category data structure
 */
struct Category {
  uint256 id;
  string name;
  string description;
}

/**
 * @dev Description and id of each index
 */
struct RegenerationIndexDescription {
  uint256 regenerationIndexId;
  string description;
}

/**
 * @dev RegenerationIndex name and value
 */
struct RegenerationIndex {
  string name;
  uint256 value;
}
