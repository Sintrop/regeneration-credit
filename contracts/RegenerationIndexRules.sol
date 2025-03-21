// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, RegenerationIndex, RegenerationIndexDescription } from "./types/IndexTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { RegenerationInspection } from "./types/InspectionTypes.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @author Sintrop
 * @title RegenerationIndexRules
 * @dev Manage index categories and score
 */
contract RegenerationIndexRules is Ownable, Callable {
  /// @notice Relationship between id and category data
  mapping(uint256 => Category) public categories;

  /// @notice Relationship between category id and category descriptions
  mapping(uint256 => RegenerationIndexDescription[]) public categoryRegenerationIndexDescriptions;
  mapping(uint256 => RegenerationIndex) public regenerationIndex;

  uint256 public categoryCounts;

  constructor() {
    regenerationIndex[1] = RegenerationIndex("REGENERATIVE 6", 32);
    regenerationIndex[2] = RegenerationIndex("REGENERATIVE 5", 16);
    regenerationIndex[3] = RegenerationIndex("REGENERATIVE 4", 8);
    regenerationIndex[4] = RegenerationIndex("REGENERATIVE 3", 4);
    regenerationIndex[5] = RegenerationIndex("REGENERATIVE 2", 2);
    regenerationIndex[6] = RegenerationIndex("REGENERATIVE 1", 1);
    regenerationIndex[7] = RegenerationIndex("NEUTRO", 0);

    addCategories();

    categoryCounts = 2;
  }

  /**
   * @dev create categories to the system
   */
  function addCategories() internal {
    Category memory treesCategory = Category(
      1,
      "Trees",
      "Indicator to measure the total amount of trees, palm trees and other plants over 5cm in diameter in the regenerating area. How many trees, palm trees and other plants with more than 5cm of diameters there is in the regenerating area? Justify your answer in the report."
    );

    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(1, "Trees > 20000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(2, "20000 > Trees > 10000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(3, "10000 > Trees > 5000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(4, "5000 > Trees > 1000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(5, "1000 > Trees > 100"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(6, "100 > Trees > 10"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(7, "Trees < 10"));

    Category memory biodiversityCategory = Category(
      2,
      "Biodiversity",
      "Indicator to measure the level of biodiversity of trees, palm trees and other plants over 5cm of diamater in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted."
    );

    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(1, "Biodiversity > 240"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(2, "240 > Biodiversity > 120"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(3, "120 > Biodiversity > 60"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(4, "60 > Biodiversity > 30"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(5, "30 > Biodiversity > 15"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(6, "15 > Biodiversity > 5"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(7, "Biodiversity < 5"));

    categories[1] = treesCategory;
    categories[2] = biodiversityCategory;
  }

  /**
   * @dev Returns all added category regeneration index description
   * @return RegenerationIndexDescription struct array
   */
  function getCategoryRegenerationIndexDescription(
    uint256 categoryId
  ) public view returns (RegenerationIndexDescription[] memory) {
    return categoryRegenerationIndexDescriptions[categoryId];
  }

  /**
   * @dev Function to calculate the inspection score
   * @param treesResult Inspection result provided by inspector
   * @param biodiversityResult Inspection result provided by inspector
   * @return int256 Inspection score
   */
  function calculateScore(
    RegenerationInspection memory treesResult,
    RegenerationInspection memory biodiversityResult
  ) public view returns (uint256) {
    RegenerationIndex memory trees = regenerationIndex[treesRegenerationIndexId(treesResult.indicator)];
    RegenerationIndex memory biodiversity = regenerationIndex[
      biodiversityRegenerationIndexId(biodiversityResult.indicator)
    ];

    return trees.value + biodiversity.value;
  }

  /**
   * @dev Function to calculate the trees inspection score
   * @param indicator The result provided by the inspector
   * @return The category regeneration score
   */
  function treesRegenerationIndexId(uint256 indicator) internal pure returns (uint256) {
    if (indicator > 20000) {
      return 1;
    } else if (indicator > 10000 && indicator < 20000) {
      return 2;
    } else if (indicator > 5000 && indicator < 10000) {
      return 3;
    } else if (indicator > 1000 && indicator < 5000) {
      return 4;
    } else if (indicator > 100 && indicator < 1000) {
      return 5;
    } else if (indicator > 10 && indicator < 100) {
      return 6;
    } else {
      return 7;
    }
  }

  /**
   * @dev Function to calculate the biodiversity inspection score
   * @param indicator The result provided by the inspector
   * @return The category regeneration score
   */
  function biodiversityRegenerationIndexId(uint256 indicator) internal pure returns (uint256) {
    if (indicator > 240) {
      return 1;
    } else if (indicator > 120 && indicator < 240) {
      return 2;
    } else if (indicator > 60 && indicator < 120) {
      return 3;
    } else if (indicator > 30 && indicator < 60) {
      return 4;
    } else if (indicator > 15 && indicator < 30) {
      return 5;
    } else if (indicator > 5 && indicator < 15) {
      return 6;
    } else {
      return 7;
    }
  }
}
