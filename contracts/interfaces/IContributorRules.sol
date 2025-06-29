// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IContributorRules
 * @notice Interface for the ContributorRules contract, defining rules
 * and conditions specific to Contributor users.
 */
interface IContributorRules {

    /**
     * @notice Checks if a contributor is currently eligible to send an invitation.
     * @param account The address of the contributor account to check.
     * @return true if the contributor can send an invite, false otherwise.
     */
    function canSendInvite(address account) external view returns (bool);
}