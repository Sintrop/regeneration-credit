// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IDeveloperPool
 * @notice Interface for the DeveloperPool contract, which handles token
 * custody, distribution, and era-based logic for developers.
 */
interface IDeveloperPool {
  /**
   * @notice Checks if a developer is eligible to withdraw rewards for a given era.
   * @param era The era number to check eligibility for.
   * @return true if the developer can withdraw, false otherwise.
   */
  function canWithdraw(uint256 era) external view returns (bool);

  /**
   * @notice Allows a user to withdraw their tokens for a specific era.
   * @param user The address of the developer withdrawing tokens.
   * @param era The era for which the withdrawal is being made.
   */
  function withdraw(address user, uint256 era) external;

  /**
   * @notice Removes specified levels from a user's pool configuration.
   * @param user The address of the developer.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(address user, bool denied) external;

  /**
   * @notice Adds a new level to a user's pool configuration.
   * @param user The address of the developer.
   * @param levels The levels to be added.
   */
  function addLevel(address user, uint256 levels, uint64 eventId) external;

  /**
   * @notice Returns the current era of the contract.
   * @return The current era number.
   */
  function currentContractEra() external view returns (uint256);

  /**
   * @notice Calculates the time or blocks remaining until the next era begins.
   * @param currentEra The current era, passed as a parameter for calculation.
   * @return The number of seconds or blocks until the next era.
   */
  function nextEraIn(uint256 currentEra) external view returns (uint256);
}
