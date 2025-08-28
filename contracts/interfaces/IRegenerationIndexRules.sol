// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title IRegenerationIndexRules
 * @notice Interface for the RegenerationIndexRules contract, which is responsible
 * for calculating a standardized regeneration score.
 */
interface IRegenerationIndexRules {
  /**
   * @notice Calculates a regeneration score based on tree and biodiversity metrics.
   * @dev A pure function for on-the-fly score calculation. It can be called
   * by any contract to determine regeneration scores based on a consistent formula.
   * @param treesResult A numerical result or score related to tree metrics.
   * @param biodiversityResult A numerical result or score related to biodiversity metrics.
   * @return The final calculated regeneration score.
   */
  function calculateScore(uint32 treesResult, uint32 biodiversityResult) external view returns (uint32);
}
