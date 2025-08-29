// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev RegenerationIndex category data structure.
 * @param id Unique id for the category.
 * @param name Category name.
 * @param description Category description.
 */
struct Category {
  uint64 id;
  string name;
  string description;
}

/**
 * @dev Description and id of each index.
 */
struct RegenerationIndexDescription {
  uint8 regenerationIndexId;
  string description;
}

/**
 * @dev RegenerationIndex name and value.
 */
struct RegenerationIndex {
  string name;
  uint32 value;
}
