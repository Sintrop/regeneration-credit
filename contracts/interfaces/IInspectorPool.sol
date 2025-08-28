// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IInspectorPool
 * @notice Interface for the InspectorPool contract, which handles token
 * custody, distribution, and era-based logic for inspectors.
 */
interface IInspectorPool {
  /**
   * @notice Checks if a inspector is eligible to withdraw rewards for a given era.
   * @param era The era number to check eligibility for.
   * @return true if the inspector can withdraw, false otherwise.
   */
  function canWithdraw(uint256 era) external view returns (bool);

  /**
   * @notice Allows a user to withdraw their tokens for a specific era.
   * @param user The address of the inspector withdrawing tokens.
   * @param era The era for which the withdrawal is being made.
   */
  function withdraw(address user, uint256 era) external;

  /**
   * @notice Removes specified levels from a user's pool configuration.
   * @param user The address of the inspector.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(address user, bool denied) external;

  /**
   * @notice Adds a new level to a user's pool configuration.
   * @param user The address of the inspector.
   * @param levels The levels to be added.
   */
  function addLevel(address user, uint256 levels, uint64 eventId) external;

  /**
   * @notice Returns the current era of the contract.
   * @return The current era number.
   */
  function currentContractEra() external view returns (uint256);
}
