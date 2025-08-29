// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "contracts/types/DeveloperTypes.sol";

/**
 * @title IDeveloperRules
 * @notice Interface for the DeveloperRules contract, defining rules
 * and conditions specific to Developer users.
 */
interface IDeveloperRules {
  /**
   * @notice Checks if a developer is currently eligible to send an invitation.
   * @param account The address of the developer account to check.
   * @return true if the developer can send an invite, false otherwise.
   */
  function canSendInvite(address account) external view returns (bool);

  /**
   * @notice Retrieves the full Developer struct for a given account.
   * @param account The address of the developer.
   * @return The Developer struct containing the user's data.
   */
  function getDeveloper(address account) external view returns (Developer memory);

  /**
   * @notice Returns the total number of reports made.
   * @dev This is likely a getter for a public state variable.
   * @return The total count of all reports.
   */
  function reportsTotalCount() external view returns (uint64);

  /**
   * @notice Adds a penalty to a developer and returns their new total penalty count.
   * @param developer The address of the developer receiving the penalty.
   * @param reportId The ID of the report related to the penalty.
   * @return The new total number of penalties for the developer.
   */
  function addPenalty(address developer, uint64 reportId) external returns (uint256);

  /**
   * @notice Returns the maximum number of penalties a developer can have before being denied.
   * @return The maximum penalty count.
   */
  function maxPenalties() external view returns (uint8);

  /**
   * @notice Returns the current era of the related pool.
   * @return The current era number.
   */
  function poolCurrentEra() external view returns (uint256);

  /**
   * @notice Removes a specified level from a developer's pool configuration.
   * @dev As specified, this function does not return a value.
   * @param developer The address of the developer.
   */
  function removePoolLevels(address developer) external;
}
