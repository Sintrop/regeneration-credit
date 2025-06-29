// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IActivistRules_Validation
 * @notice Interface for the validation and penalty-related functionalities of
 * the ActivistRules contract.
 */
interface IActivistRules_Validation {

    /**
     * @notice Returns the current era of the related pool.
     * @return The current era number.
     */
    function poolCurrentEra() external view returns (uint256);

    /**
     * @notice Removes a specified level from a activist's pool configuration.
     * @dev As specified, this function does not return a value.
     * @param activist The address of the activist.
     * @param levelToRemove The levels to be removed.
     */
    function removePoolLevels(address activist, uint256 levelToRemove) external;
}