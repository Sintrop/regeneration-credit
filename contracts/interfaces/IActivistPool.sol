// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IActivistPool
 * @notice Interface for the ActivistPool contract, which handles token
 * custody, distribution, and era-based logic for activists.
 */
interface IActivistPool {
  /**
   * @notice Checks if a activist is eligible to withdraw rewards for a given era.
   * @param era The era number to check eligibility for.
   * @return true if the activist can withdraw, false otherwise.
   */
  function canWithdraw(uint256 era) external view returns (bool);

  /**
   * @notice Allows a user to withdraw their tokens for a specific era.
   * @param user The address of the activist withdrawing tokens.
   * @param era The era for which the withdrawal is being made.
   */
  function withdraw(address user, uint256 era) external;

  /**
   * @notice Removes specified levels from a user's pool configuration.
   * @param user The address of the activist.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(address user, bool denied) external;

  /**
   * @notice Adds a new level to a user's pool configuration.
   * @param user The address of the activist.
   * @param levels The levels to be added.
   */
  function addLevel(address user, uint256 levels, bytes32 eventId) external;

  /**
   * @notice Returns the current era of the contract.
   * @return The current era number.
   */
  function currentContractEra() external view returns (uint256);
}
