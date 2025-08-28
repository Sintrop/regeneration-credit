// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IVoteRules
 * @notice Interface for the VoteRules contract, which manages voting eligibility.
 */
interface IVoteRules {
  /**
   * @notice Checks if a given account is eligible to vote.
   * @dev This is the single public entry point for checking voting rights.
   * @param account The address of the account to check.
   * @return true if the account can vote, false otherwise.
   */
  function canVote(address account) external view returns (bool);
}
