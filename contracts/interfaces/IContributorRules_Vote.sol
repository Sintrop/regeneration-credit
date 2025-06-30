// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/ContributorTypes.sol";

/**
 * @title IContributorRules_Vote
 * @notice Interface for the voting-related query functionalities of the
 * ContributorRules contract.
 */
interface IContributorRules_Vote {
  /**
   * @notice Retrieves the full Contributor struct for a given account.
   * @param account The address of the contributor.
   * @return The Contributor struct containing the user's data.
   */
  function getContributor(address account) external view returns (Contributor memory);

  /**
   * @notice Returns the total number of contributions made.
   * @dev This is likely a getter for a public state variable.
   * @return The total count of all contributions.
   */
  function contributionsTotalCount() external view returns (uint64);
}
