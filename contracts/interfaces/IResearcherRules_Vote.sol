// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/ResearcherTypes.sol";

/**
 * @title IResearcherRules_Vote
 * @notice Interface for the voting-related query functionalities of the
 * ResearcherRules contract.
 */
interface IResearcherRules_Vote {
  /**
   * @notice Retrieves the full Researcher struct for a given account.
   * @param account The address of the researcher.
   * @return The Researcher struct containing the user's data.
   */
  function getResearcher(address account) external view returns (Researcher memory);

  /**
   * @notice Returns the total number of researches made.
   * @dev This is likely a getter for a public state variable.
   * @return The total count of all researches.
   */
  function researchesTotalCount() external view returns (uint64);
}
