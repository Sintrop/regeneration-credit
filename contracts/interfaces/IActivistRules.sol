// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "contracts/types/ActivistTypes.sol";

/**
 * @title IActivistRules
 * @notice Interface for the ActivistRules contract.
 */
interface IActivistRules {
  /**
   * @notice Adds a level Activist when invited user completes 3 totalInspections.
   * @dev Called by InspectionRules after a Inspector
   * completes/realize a inspection.
   * @param regenerator The address of the Regenerator receiving the inspection.
   * @param totalInspections The new regenerator totalInspections.
   */
  function addRegeneratorLevel(address regenerator, uint256 totalInspections) external;

  /**
   * @notice Adds a level Activist when invited user completes 3 totalInspections.
   * @dev Called by InspectionRules after a Inspector
   * completes/realize a inspection.
   * @param inspector The address of the Inspector realizing the inspection.
   * @param totalInspections The new inspector totalInspections.
   */
  function addInspectorLevel(address inspector, uint256 totalInspections) external;

  /**
   * @notice Checks if an activist is currently eligible to send an invitation.
   * @param account The address of the activist account to check.
   * @return true if the activist can send an invite, false otherwise.
   */
  function canSendInvite(address account) external view returns (bool);

  /**
   * @notice Returns the current era of the related pool.
   * @return The current era number.
   */
  function poolCurrentEra() external view returns (uint256);

  /**
   * @notice Removes a specified level from a activist's pool configuration.
   * @dev As specified, this function does not return a value.
   * @param activist The address of the activist.
   */
  function removePoolLevels(address activist) external;

  /**
   * @notice Retrieves the full Activist struct for a given account.
   * @param account The address of the activist.
   * @return The Activist struct containing the user's data.
   */
  function getActivist(address account) external view returns (Activist memory);

  /**
   * @notice Returns the number of approved invites from non-denied users.
   * @return The total count of totalActiveLevels.
   */
  function totalActiveLevels() external view returns (uint256);
}
