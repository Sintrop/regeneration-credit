// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/ActivistTypes.sol";

/**
 * @title IActivistRules_Vote
 * @notice Interface for the voting-related query functionalities of the
 * ActivistRules contract.
 */
interface IActivistRules_Vote {
  /**
   * @notice Retrieves the full Activist struct for a given account.
   * @param account The address of the activist.
   * @return The Activist struct containing the user's data.
   */
  function getActivist(address account) external view returns (Activist memory);

  /**
   * @notice Returns the number of approved invites.
   * @dev This is likely a getter for a public state variable.
   * @return The total count of approved invites.
   */
  function approvedInvites() external view returns (uint32);
}
