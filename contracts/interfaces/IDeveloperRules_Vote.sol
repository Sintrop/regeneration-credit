// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/DeveloperTypes.sol";

/**
 * @title IDeveloperRules_Vote
 * @notice Interface for the voting-related query functionalities of the
 * DeveloperRules contract.
 */
interface IDeveloperRules_Vote {
  /**
   * @notice Retrieves the full Developer struct for a given account.
   * @param account The address of the developer.
   * @return The Developer struct containing the user's data.
   */
  function getDeveloper(address account) external view returns (Developer memory);

  /**
   * @notice Returns the total number of reports made.
   * @dev This is likely a getter for a public state variable.
   * @return The total count of all reports.
   */
  function reportsTotalCount() external view returns (uint64);
}
