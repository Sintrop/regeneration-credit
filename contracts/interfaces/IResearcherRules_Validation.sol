// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title IResearcherRules_Validation
 * @notice Interface for the validation and penalty-related functionalities of
 * the ResearcherRules contract.
 */
interface IResearcherRules_Validation {
  /**
   * @notice Adds a penalty to a researcher and returns their new total penalty count.
   * @param researcher The address of the researcher receiving the penalty.
   * @param researchId The ID of the research item related to the penalty.
   * @return The new total number of penalties for the researcher.
   */
  function addPenalty(address researcher, uint64 researchId) external returns (uint256);

  /**
   * @notice Returns the maximum number of penalties a researcher can have before being denied.
   * @return The maximum penalty count as a uint8.
   */
  function maxPenalties() external view returns (uint8);

  /**
   * @notice Returns the current era of the related pool.
   * @return The current era number.
   */
  function poolCurrentEra() external view returns (uint256);

  /**
   * @notice Removes a specified level from a researcher's pool configuration.
   * @dev As specified, this function does not return a value and takes a single uint256 for the level.
   * @param researcher The address of the researcher.
   * @param levelToRemove The levels to be removed.
   */
  function removePoolLevels(address researcher, uint256 levelToRemove) external;
}
