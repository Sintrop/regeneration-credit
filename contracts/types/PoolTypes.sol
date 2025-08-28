// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Data structuer of users and levels per Era.
 * @param claimsCount Number of realized withdrawals.
 * @param tokens Total tokens distributed on Era.
 * @param levels Total registered levels of the Era, used as difficulty pool measurement.
 */
struct Era {
  uint256 claimsCount;
  uint256 tokens;
  uint256 levels;
}
