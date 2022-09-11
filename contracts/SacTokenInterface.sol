// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

interface SacTokenInterface {
  function balanceOf(address tokenOwner) external view returns (uint256);

  function allowance(address owner, address delegate) external view returns (uint256);

  function approveWith(address delegate, uint256 numTokens) external returns (uint256);

  function transferWith(
    address tokenOwner,
    address receiver,
    uint256 numTokens
  ) external returns (bool);

  function transferFrom(
    address owner,
    address to,
    uint256 numTokens
  ) external returns (bool);
}
