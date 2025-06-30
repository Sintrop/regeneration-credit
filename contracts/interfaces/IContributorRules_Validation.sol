// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IContributorRules_Validation
 * @notice Interface for the validation and penalty-related functionalities of
 * the ContributorRules contract.
 */
interface IContributorRules_Validation {
  /**
   * @notice Adds a penalty to a contributor and returns their new total penalty count.
   * @param contributor The address of the contributor receiving the penalty.
   * @param reportId The ID of the report related to the penalty.
   * @return The new total number of penalties for the contributor.
   */
  function addPenalty(address contributor, uint64 reportId) external returns (uint256);

  /**
   * @notice Returns the maximum number of penalties a contributor can have before being denied.
   * @return The maximum penalty count.
   */
  function maxPenalties() external view returns (uint8);

  /**
   * @notice Returns the current era of the related pool.
   * @return The current era number.
   */
  function poolCurrentEra() external view returns (uint256);

  /**
   * @notice Removes a specified level from a contributor's pool configuration.
   * @dev As specified, this function does not return a value.
   * @param contributor The address of the contributor.
   * @param levelToRemove The levels to be removed.
   */
  function removePoolLevels(address contributor, uint256 levelToRemove) external;
}
