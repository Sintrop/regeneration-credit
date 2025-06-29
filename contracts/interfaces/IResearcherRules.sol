// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IResearcherRules
 * @notice Interface for the ResearcherRules contract, defining rules
 * and conditions specific to Researcher users.
 */
interface IResearcherRules {

    /**
     * @notice Checks if a researcher is currently eligible to send an invitation.
     * @param account The address of the researcher account to check.
     * @return true if the researcher can send an invite, false otherwise.
     */
    function canSendInvite(address account) external view returns (bool);
}