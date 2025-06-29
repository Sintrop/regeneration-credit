// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IActivistRules
 * @notice Interface for the ActivistRules contract, defining rules
 * and conditions specific to Activist users.
 */
interface IActivistRules_Invitation {
  /**
   * @notice Checks if an activist is currently eligible to send an invitation.
   * @param account The address of the activist account to check.
   * @return true if the activist can send an invite, false otherwise.
   */
  function canSendInvite(address account) external view returns (bool);
}
