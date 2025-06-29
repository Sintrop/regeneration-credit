// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/RegeneratorTypes.sol";

/**
 * @title IRegeneratorRules
 * @notice Interface for the RegeneratorRules contract, which manages the
 * data and state transitions for Regenerator users, especially regarding inspections.
 */
interface IRegeneratorRules {

    /**
     * @notice Retrieves the full Regenerator struct for a given account.
     * @param account The address of the regenerator.
     * @return The Regenerator struct containing the user's data.
     */
    function getRegenerator(address account) external view returns (Regenerator memory);

    /**
     * @notice A hook to be called after an inspection has been accepted.
     * @param regenerator The address of the regenerator associated with the inspection.
     */
    function afterAcceptInspection(address regenerator) external;

    /**
     * @notice Returns the current era of the related pool.
     * @return The current era number.
     */
    function poolCurrentEra() external view returns (uint256);

    /**
     * @notice A hook to be called after a regenerator requests an inspection.
     * @param regenerator The address of the regenerator requesting the inspection.
     */
    function afterRequestInspection(address regenerator) external;

    /**
     * @notice A hook to be called after an inspection is completed.
     * @param regenerator The address of the regenerator that was inspected.
     * @param regenerationScore The score calculated from the inspection.
     */
    function afterRealizeInspection(address regenerator, uint32 regenerationScore) external returns (uint256);

    /**
     * @notice Calculates the time or blocks remaining until the next era begins.
     * @return The number of seconds or blocks until the next era.
     */
    function nextEraIn() external view returns (uint256);
}