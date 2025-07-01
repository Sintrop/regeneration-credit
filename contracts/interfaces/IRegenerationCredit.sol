// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IRegenerationCredit
 * @notice Interface for token interaction with the RegenerationCredit contract.
 */
interface IRegenerationCredit {
  function balanceOf(address tokenOwner) external view returns (uint256);

  function allowance(address owner, address delegate) external view returns (uint256);

  function transfer(address to, uint256 amount) external returns (bool);

  function transferFrom(address owner, address to, uint256 numTokens) external returns (bool);

  function transferWith(address tokenOwner, address receiver, uint256 numTokens) external;

  function poolTransfer(address tokenOwner, address receiver, uint256 numTokens) external;
}
