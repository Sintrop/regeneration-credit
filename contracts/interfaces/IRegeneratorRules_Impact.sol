// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IRegeneratorRules_Impact
 * @notice Interface for querying impact metrics related to
 * all Regenerator users from the RegeneratorRules contract.
 */
interface IRegeneratorRules_Impact {
  /**
   * @notice Returns the total number of impact regenerators, users that completed 3 inspections.
   * @return The total impact regenerators.
   */
  function totalImpactRegenerators() external view returns (uint256);

  /**
   * @notice Returns the total area under regeneration across all regenerators.
   * @return The total regeneration area, in square meters.
   */
  function regenerationArea() external view returns (uint256);
}
