// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IRegenerationCredit_Impact
 * @notice Interface for querying impact metrics from the
 * RegenerationCredit token contract.
 */
interface IRegenerationCredit_Impact {
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
