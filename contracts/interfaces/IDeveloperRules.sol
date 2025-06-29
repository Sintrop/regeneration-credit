// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IDeveloperRules
 * @notice Interface for the DeveloperRules contract, defining rules
 * and conditions specific to Developer users.
 */
interface IDeveloperRules {

    /**
     * @notice Checks if a developer is currently eligible to send an invitation.
     * @param account The address of the developer account to check.
     * @return true if the developer can send an invite, false otherwise.
     */
    function canSendInvite(address account) external view returns (bool);
}