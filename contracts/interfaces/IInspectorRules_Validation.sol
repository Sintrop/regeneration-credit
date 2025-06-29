// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IInspectorRules_Validation
 * @notice Interface for the validation and penalty-related functionalities of
 * the InspectorRules contract.
 */
interface IInspectorRules_Validation {
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
   * @param levelToRemove The ID of the level to be removed.
   */
  function removePoolLevels(address inspector, uint256 levelToRemove) external;
}
