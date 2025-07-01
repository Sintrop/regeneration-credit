// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/InspectorTypes.sol";

/**
 * @title IInspectorRules_Inspection
 * @notice Interface for the InspectorRules contract, which manages the rules,
 * status, and actions for Inspector users.
 */
interface IInspectorRules_Inspection {
  /**
   * @notice Checks if an inspector is still valid and has not exceeded their limits (e.g., give-ups).
   * @param account The address of the inspector to check.
   * @return true if the inspector is valid, false otherwise.
   */
  function isInspectorValid(address account) external view returns (bool);

  /**
   * @notice Checks if an inspector is currently able to accept a new inspection.
   * @param account The address of the inspector.
   * @return true if the inspector can accept an inspection, false otherwise.
   */
  function canAcceptInspection(address account) external view returns (bool);

  /**
   * @notice A hook to be called after an inspector accepts an inspection.
   * @dev Updates the inspector's state accordingly.
   * @param inspector The address of the inspector.
   * @param inspectionId The ID of the inspection that was accepted.
   */
  function afterAcceptInspection(address inspector, uint64 inspectionId) external;

  /**
   * @notice A hook to be called after an inspector successfully completes an inspection.
   * @dev This function likely updates the inspector's counters and returns their new level or score.
   * @param inspector The address of the inspector who completed the inspection.
   * @return The new calculated level for the inspector.
   */
  function afterRealizeInspection(address inspector) external returns (uint256);

  /**
   * @notice Retrieves the full Inspector struct for a given account.
   * @param account The address of the inspector.
   * @return The Inspector struct containing the user's data.
   */
  function getInspector(address account) external view returns (Inspector memory);
}
