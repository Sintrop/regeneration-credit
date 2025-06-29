// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IActivistRules
 * @notice Interface for the ActivistRules contract.
 */
interface IActivistRules_Inspection {
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
}
