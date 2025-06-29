// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IRegeneratorRules_Validation
 * @notice Interface for functionalities of the RegeneratorRules contract that
 * are called during a validation or invalidation process.
 */
interface IRegeneratorRules_Validation {

    /**
     * @notice Returns the current era of the related pool.
     * @return The current era number.
     */
    function poolCurrentEra() external view returns (uint256);

    /**
     * @notice Decrements the valid inspections count for a regenerator.
     * @dev Called when an inspection is invalidated.
     * @param regenerator The address of the regenerator.
     */
    function decrementInspections(address regenerator) external;

    /**
     * @notice Removes specified levels from a user's pool configuration.
     * @dev The use of 'return' in the calling contract suggests this function
     * returns a status, likely a boolean indicating success.
     * @param user The address of the regenerator.
     * @param levelsToRemove Levels/score to be removed.
     */
    function removePoolLevels(address user, uint256 levelsToRemove) external;
}