// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import "../types/ResearcherTypes.sol";

/**
 * @title IResearcherRules
 * @notice Interface for the voting-related query functionalities of the
 * ResearcherRules contract.
 */
interface IResearcherRules {
  /**
   * @notice Retrieves the full Researcher struct for a given account.
   * @param account The address of the researcher.
   * @return The Researcher struct containing the user's data.
   */
  function getResearcher(address account) external view returns (Researcher memory);

  /**
   * @notice Retrieves the full calculatorItem struct for a given id.
   * @param id The id of the calculatorItem.
   * @return The Calculator item struct containing the item's data.
   */
  function getCalculatorItem(uint64 id) external view returns (CalculatorItem memory);

  /**
   * @notice Returns the total number of activeLevels from non-denied users.
   * @return The total count of totalActiveLevels.
   */
  function totalActiveLevels() external view returns (uint256);

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
   */
  function removePoolLevels(address researcher) external;

  /**
   * @notice Checks if a researcher is currently eligible to send an invitation.
   * @param account The address of the researcher account to check.
   * @return true if the researcher can send an invite, false otherwise.
   */
  function canSendInvite(address account) external view returns (bool);
}
