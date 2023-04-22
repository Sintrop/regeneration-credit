// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

interface PoolPassiveInterface {
  /*
   * @dev Allow a user approve tokens from pool to your account
   */
  function approveWith(address delegate, uint256 _numTokens) external returns (bool);

  /*
   * @dev Allow a user transfer tokens to pool
   */
  function transferWith(address tokenOwner, address receiver, uint256 tokens) external returns (bool);

  /*
   * @dev Allow a user withdraw (transfer) your tokens approved to your account
   */
  function withDraw() external returns (bool);

  /*
   * @dev Allow a user know how much tokens his has approved from pool
   */
  function allowance() external view returns (uint256);

  /*
   * @dev Allow a user know how much tokens this pool has available
   */
  function balance() external view returns (uint256);

  /*
   * @dev Allow a user know how much tokens this pool has available
   */
  function balanceOf(address tokenOwner) external view returns (uint256);
}
