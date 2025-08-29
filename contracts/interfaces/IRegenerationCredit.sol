// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IRegenerationCredit
 * @notice Interface for token interaction with the RegenerationCredit contract.
 */
interface IRegenerationCredit {
  function balanceOf(address tokenOwner) external view returns (uint256);

  function allowance(address owner, address delegate) external view returns (uint256);

  function transfer(address to, uint256 amount) external returns (bool);

  function transferFrom(address owner, address to, uint256 numTokens) external returns (bool);

  function burnFrom(address account, uint256 amount) external;

  function decreaseLocked(uint256 numTokens) external;

  /**
   * @notice Returns the total supply of tokens in existence.
   * @dev Standard ERC-20 function.
   * @return The total number of tokens.
   */
  function totalSupply() external view returns (uint256);

  /**
   * @notice Returns the total amount of credits that have been certified.
   * @return The total certified amount.
   */
  function totalCertified_() external view returns (uint256);

  /**
   * @notice Returns the total amount of tokens currently locked in the protocol.
   * @return The total locked amount.
   */
  function totalLocked_() external view returns (uint256);
}
