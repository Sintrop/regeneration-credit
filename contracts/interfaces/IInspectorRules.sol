// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "contracts/types/InspectorTypes.sol";

/**
 * @title IInspectorRules
 * @notice Interface for the InspectorRules contract, which manages the rules,
 * status, and actions for Inspector users.
 */
interface IInspectorRules {
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
   * @param score The regenerationScore of the inspection.
   * @param inspectionId The inspection unique ID.
   * @return The new calculated level for the inspector.
   */
  function afterRealizeInspection(address inspector, uint32 score, uint64 inspectionId) external returns (uint256);

  /**
   * @dev Function to deny inspectors.
   */
  function denyInspector(address inspector) external;

  /**
   * @notice Retrieves the full Inspector struct for a given account.
   * @param account The address of the inspector.
   * @return The Inspector struct containing the user's data.
   */
  function getInspector(address account) external view returns (Inspector memory);

  /**
   * @notice Adds a penalty to an inspector and returns their new total penalty count.
   * @param inspector The address of the inspector receiving the penalty.
   * @param inspectionId The ID of the inspection related to the penalty.
   * @return The new total number of penalties for the inspector.
   */
  function addPenalty(address inspector, uint64 inspectionId) external returns (uint256);

  /**
   * @notice Returns the maximum number of penalties an inspector can have before being denied.
   * @return The maximum penalty count.
   */
  function maxPenalties() external view returns (uint8);

  /**
   * @notice Returns the current era of the related pool.
   * @return The current era number.
   */
  function poolCurrentEra() external view returns (uint256);

  /**
   * @notice Decrements the active inspections count for an inspector.
   * @dev Likely called when an inspection is cancelled or invalidated.
   * @param inspector The address of the inspector.
   */
  function decrementInspections(address inspector) external;

  /**
   * @notice Removes a specified level from an inspector's pool configuration.
   * @dev As specified, this function does not return a value.
   * @param inspector The address of the inspector.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(address inspector, bool denied) external;
}
