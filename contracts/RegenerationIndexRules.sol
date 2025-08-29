// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { Category, RegenerationIndex, RegenerationIndexDescription } from "./types/IndexTypes.sol";

/**
 * @title RegenerationIndexRules
 * @author Sintrop
 * @dev Manage index categories and score.
 * @notice This contract handles the RegenerationIndexRules, used by the inspections to estimate the Regenerator impact
 * and calculate the RegnerationScore. The system will have only two categories: Trees & Biodiversity.
 */
contract RegenerationIndexRules {
  // --- Constants ---

  /// @notice Allowed categories: Trees & Biodiversity.
  uint8 public constant CATEGORY_COUNTS = 2;

  // Tree thresholds
  uint32 private constant TREES_THRESHOLD_LEVEL_1 = 50000;
  uint32 private constant TREES_THRESHOLD_LEVEL_2 = 25000;
  uint32 private constant TREES_THRESHOLD_LEVEL_3 = 12500;
  uint32 private constant TREES_THRESHOLD_LEVEL_4 = 6250;
  uint32 private constant TREES_THRESHOLD_LEVEL_5 = 3125;
  uint32 private constant TREES_THRESHOLD_LEVEL_6 = 20;

  // Biodiversity thresholds
  uint32 private constant BIO_THRESHOLD_LEVEL_1 = 160;
  uint32 private constant BIO_THRESHOLD_LEVEL_2 = 80;
  uint32 private constant BIO_THRESHOLD_LEVEL_3 = 40;
  uint32 private constant BIO_THRESHOLD_LEVEL_4 = 20;
  uint32 private constant BIO_THRESHOLD_LEVEL_5 = 10;
  uint32 private constant BIO_THRESHOLD_LEVEL_6 = 5;

  // --- State variables ---

  /// @notice Relationship between id and category data
  mapping(uint8 => Category) public categories;

  /// @notice Relationship between category id and category descriptions
  mapping(uint8 => RegenerationIndexDescription[]) public categoryRegenerationIndexDescriptions;

  /// @notice Relationship between regeneration index id and its name/value
  mapping(uint32 => RegenerationIndex) public regenerationIndex;

  constructor() {
    regenerationIndex[1] = RegenerationIndex("REGENERATIVE 6", 32);
    regenerationIndex[2] = RegenerationIndex("REGENERATIVE 5", 16);
    regenerationIndex[3] = RegenerationIndex("REGENERATIVE 4", 8);
    regenerationIndex[4] = RegenerationIndex("REGENERATIVE 3", 4);
    regenerationIndex[5] = RegenerationIndex("REGENERATIVE 2", 2);
    regenerationIndex[6] = RegenerationIndex("REGENERATIVE 1", 1);
    regenerationIndex[7] = RegenerationIndex("NEUTRO", 0);

    _addCategories();
  }

  // --- Private functions ---

  /**
   * @dev Private function that creates system categories and their regeneration index descriptions.
   * This function is intended to be called only during contract deployment.
   */
  function _addCategories() private {
    Category memory treesCategory = Category(
      1,
      "Trees",
      "Indicator to measure the total amount of trees, palm trees and other plants over 1m high and 3cm in diameter in the regenerating area. How many trees, palm trees and other plants over 1m high and 3cm in diameter there is in the regenerating area? Justify your answer in the report."
    );

    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(1, "trees >= 50000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(2, "trees >= 25000 && trees < 50000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(3, "trees >= 12500 && trees < 25000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(4, "trees >= 6250 && trees < 12500"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(5, "trees >= 3125 && trees < 6250"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(6, "trees >= 20 && trees < 3125"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(7, "trees < 20"));

    Category memory biodiversityCategory = Category(
      2,
      "Biodiversity",
      "Indicator to measure the level of biodiversity of trees, palm trees and other plants over 1m high and 3cm in diameter in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted."
    );

    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(1, "Biodiversity >= 160"));
    categoryRegenerationIndexDescriptions[2].push(
      RegenerationIndexDescription(2, "Biodiversity >= 80 && Biodiversity < 160")
    );
    categoryRegenerationIndexDescriptions[2].push(
      RegenerationIndexDescription(3, "Biodiversity >= 40 && Biodiversity < 80")
    );
    categoryRegenerationIndexDescriptions[2].push(
      RegenerationIndexDescription(4, "Biodiversity >= 20 && Biodiversity < 40")
    );
    categoryRegenerationIndexDescriptions[2].push(
      RegenerationIndexDescription(5, "Biodiversity >= 10 && Biodiversity < 20")
    );
    categoryRegenerationIndexDescriptions[2].push(
      RegenerationIndexDescription(6, "Biodiversity >= 5 && Biodiversity < 10")
    );
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(7, "Biodiversity < 5"));

    categories[1] = treesCategory;
    categories[2] = biodiversityCategory;
  }

  /**
   * @dev Calculates the regeneration index ID for the given trees indicator.
   * This is a private pure function, meaning it does not read from or modify the contract's state.
   * @param indicator The result provided by the inspector for trees.
   * @return The regeneration index ID corresponding to the indicator.
   */
  function _treesRegenerationIndexId(uint32 indicator) private pure returns (uint32) {
    if (indicator >= TREES_THRESHOLD_LEVEL_1) {
      return 1;
    } else if (indicator >= TREES_THRESHOLD_LEVEL_2) {
      return 2;
    } else if (indicator >= TREES_THRESHOLD_LEVEL_3) {
      return 3;
    } else if (indicator >= TREES_THRESHOLD_LEVEL_4) {
      return 4;
    } else if (indicator >= TREES_THRESHOLD_LEVEL_5) {
      return 5;
    } else if (indicator >= TREES_THRESHOLD_LEVEL_6) {
      return 6;
    } else {
      return 7;
    }
  }

  /**
   * @dev Calculates the regeneration index ID for the given biodiversity indicator.
   * This is a private pure function, meaning it does not read from or modify the contract's state.
   * @param indicator The result provided by the inspector for biodiversity.
   * @return The regeneration index ID corresponding to the indicator.
   */
  function _biodiversityRegenerationIndexId(uint32 indicator) private pure returns (uint32) {
    if (indicator >= BIO_THRESHOLD_LEVEL_1) {
      return 1;
    } else if (indicator >= BIO_THRESHOLD_LEVEL_2) {
      return 2;
    } else if (indicator >= BIO_THRESHOLD_LEVEL_3) {
      return 3;
    } else if (indicator >= BIO_THRESHOLD_LEVEL_4) {
      return 4;
    } else if (indicator >= BIO_THRESHOLD_LEVEL_5) {
      return 5;
    } else if (indicator >= BIO_THRESHOLD_LEVEL_6) {
      return 6;
    } else {
      return 7;
    }
  }

  // --- View functions ---

  /**
   * @notice Returns all added regeneration index descriptions for a specific category.
   * @dev Validates the provided category ID to ensure it exists.
   * @param categoryId The ID of the category to retrieve descriptions for.
   * @return RegenerationIndexDescription struct array for the specified category.
   */
  function getCategoryRegenerationIndexDescription(
    uint8 categoryId
  ) external view returns (RegenerationIndexDescription[] memory) {
    require(categoryId > 0 && categoryId <= CATEGORY_COUNTS, "Invalid category ID");
    return categoryRegenerationIndexDescriptions[categoryId];
  }

  /**
   * @notice Calculates the overall inspection score based on trees and biodiversity results.
   * @dev This function sums the regeneration index values for trees and biodiversity indicators.
   * @param treesResult Inspection result provided by inspector for trees.
   * @param biodiversityResult Inspection result provided by inspector for biodiversity.
   * @return uint256 The combined inspection score.
   */
  function calculateScore(uint32 treesResult, uint32 biodiversityResult) external view returns (uint32) {
    RegenerationIndex memory trees = regenerationIndex[_treesRegenerationIndexId(treesResult)];
    RegenerationIndex memory biodiversity = regenerationIndex[_biodiversityRegenerationIndexId(biodiversityResult)];

    return trees.value + biodiversity.value;
  }
}
