// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IValidationPool
 * @notice Interface for the ValidationPool contract, which handles token
 * custody, distribution, and era-based logic for validators.
 */
interface IValidationPool {
  /**
   * @notice Checks if a validator is eligible to withdraw rewards for a given era.
   * @param era The era number to check eligibility for.
   * @return true if the validator can withdraw, false otherwise.
   */
  function canWithdraw(uint256 era) external view returns (bool);

  /**
   * @notice Allows a user to withdraw their tokens for a specific era.
   * @param user The address of the validator withdrawing tokens.
   * @param era The era for which the withdrawal is being made.
   */
  function withdraw(address user, uint256 era) external;

  /**
   * @notice Adds a new level to the user's validation pool from search/hunt service.
   * @param user The address of the validator.
   * @param denied The denied address.
   */
  function addLevel(address user, address denied) external;

  /**
   * @notice Adds a new level to the user's validation pool from voting points.
   * @param user The address of the validator.
   */
  function addPointsLevel(address user) external;

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
