// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

interface PoolInterface {
  /*
   * @dev Allow a user approve tokens from pool to your account
   */
  function approve(address delegate, uint256 level, uint256 currentEra) external;

  /*
   * @dev Allow a user withdraw (transfer) your tokens approved to your account
   */
  function withDraw() external returns (bool);

  /*
   * @dev Allow a user know how much tokens his has approved from pool
   */
  function allowance() external view returns (uint256);
}
