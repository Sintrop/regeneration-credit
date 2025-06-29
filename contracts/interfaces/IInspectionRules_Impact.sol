// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IInspectionRules_Impact
 * @notice Interface for querying impact metrics and counters
 * from the InspectionRules contract.
 */
interface IInspectionRules_Impact {

    /**
     * @notice Returns the total number of successfully completed inspections.
     * @return The total count of realized inspections.
     */
    function realizedInspectionsCount() external view returns (uint64);

    /**
     * @notice Returns a total, aggregated impact score related to trees
     * across all completed inspections.
     * @return The total trees impact value.
     */
    function inspectionsTreesImpact() external view returns (uint256);

    /**
     * @notice Returns a total, aggregated impact score related to biodiversity
     * across all completed inspections.
     * @return The total biodiversity impact value.
     */
    function inspectionsBiodiversityImpact() external view returns (uint256);
}