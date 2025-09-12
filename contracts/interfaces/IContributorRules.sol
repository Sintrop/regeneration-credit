// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "contracts/types/ContributorTypes.sol";

/**
 * @title IContributorRules
 * @notice Interface for the ContributorRules contract, defining rules
 * and conditions specific to Contributor users.
 */
interface IContributorRules {
  /**
   * @notice Checks if a contributor is currently eligible to send an invitation.
   * @param account The address of the contributor account to check.
   * @return true if the contributor can send an invite, false otherwise.
   */
  function canSendInvite(address account) external view returns (bool);

  /**
   * @notice Retrieves the full Contributor struct for a given account.
   * @param account The address of the contributor.
   * @return The Contributor struct containing the user's data.
   */
  function getContributor(address account) external view returns (Contributor memory);

  /**
   * @notice Returns the total number of activeLevels from non-denied users.
   * @return The total count of totalActiveLevels.
   */
  function totalActiveLevels() external view returns (uint256);

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
   */
  function removePoolLevels(address contributor) external;
}
