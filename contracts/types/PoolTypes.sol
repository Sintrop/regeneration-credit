// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

/**
 * @dev Data structuer of users and levels per Era
 */
struct Era {
  uint256 claimsCount;
  uint256 tokens;
  uint256 levels;
}
