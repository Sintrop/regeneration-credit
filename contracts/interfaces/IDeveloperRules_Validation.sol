// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IDeveloperRules_Validation
 * @notice Interface for the validation and penalty-related functionalities of
 * the DeveloperRules contract.
 */
interface IDeveloperRules_Validation {

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
    function MAX_PENALTIES() external view returns (uint8);

    /**
     * @notice Returns the current era of the related pool.
     * @return The current era number.
     */
    function poolCurrentEra() external view returns (uint256);

    /**
     * @notice Removes a specified level from a developer's pool configuration.
     * @dev As specified, this function does not return a value.
     * @param developer The address of the developer.
     * @param levelToRemove The levels to be removed.
     */
    function removePoolLevels(address developer, uint256 levelToRemove) external;
}