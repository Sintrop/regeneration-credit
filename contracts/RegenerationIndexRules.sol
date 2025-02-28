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
    regenerationIndex[1] = RegenerationIndex("REGENERATIVO 6", 25);
    regenerationIndex[2] = RegenerationIndex("REGENERATIVO 5", 16);
    regenerationIndex[3] = RegenerationIndex("REGENERATIVO 4", 8);
    regenerationIndex[4] = RegenerationIndex("REGENERATIVO 3", 4);
    regenerationIndex[5] = RegenerationIndex("REGENERATIVO 2", 2);
    regenerationIndex[6] = RegenerationIndex("REGENERATIVO 1", 1);
    regenerationIndex[7] = RegenerationIndex("NEUTRO", 0);

    addCategories();

    categoryCounts = 2;
  }

  /**
   * @dev create categories to the system
   */
  function addCategories() internal {
    Category memory biomassCategory = Category(
      1,
      "Biomass",
      "Indicator to measure the total amount of biomass in the regenerating area. How much organic matter is there on the site? Estimate by including living biomass, such as trees, plants and roots, as well as dead biomass, which includes leaves, branches, wood and other types of organic matter covering the soil. The result should be expressed in tons [t]"
    );

    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(1, "Balance > 100.000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(2, "100.000 > Balance > 10.000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(3, "10.000 > Balance > 1000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(4, "1000 > Balance > 100"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(5, "100 > Balance > 10"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(6, "10 > Balance > 0"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(7, "Not applicable"));

    Category memory biodiversityCategory = Category(
      2,
      "Biodiversity",
      "Indicator to measure the level of plant biodiversity in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted"
    );

    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(1, "Biodiversity > 1000"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(2, "1000 > Biodiversity > 500"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(3, "500 > Biodiversity > 200"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(4, "200 > Biodiversity > 100"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(5, "100 > Biodiversity > 50"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(6, "50 > Biodiversity > 25"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(7, "Biodiversity < 25"));

    categories[1] = biomassCategory;
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
   * @param biomassResult Inspection result provided by inspector
   * @param biodiversityResult Inspection result provided by inspector
   * @return int256 Inspection score
   */
  function calculateScore(
    RegenerationInspection memory biomassResult,
    RegenerationInspection memory biodiversityResult
  ) public view returns (uint256) {
    RegenerationIndex memory carbon = regenerationIndex[biomassRegenerationIndexId(biomassResult.indicator)];
    RegenerationIndex memory biodiversity = regenerationIndex[
      biodiversityRegenerationIndexId(biodiversityResult.indicator)
    ];

    return carbon.value + biodiversity.value;
  }

  /**
   * @dev Function to calculate the biomass inspection score
   * @param indicator The result provided by the inspector
   * @return The category regeneration score
   */
  function biomassRegenerationIndexId(uint256 indicator) internal pure returns (uint256) {
    if (indicator > 100000) {
      return 1;
    } else if (indicator > 10000 && indicator < 100000) {
      return 2;
    } else if (indicator > 1000 && indicator < 10000) {
      return 3;
    } else if (indicator > 100 && indicator < 1000) {
      return 4;
    } else if (indicator > 10 && indicator < 100) {
      return 5;
    } else if (indicator > 0 && indicator < 10) {
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
    if (indicator > 1000) {
      return 1;
    } else if (indicator > 500 && indicator < 1000) {
      return 2;
    } else if (indicator > 200 && indicator < 500) {
      return 3;
    } else if (indicator > 100 && indicator < 200) {
      return 4;
    } else if (indicator > 50 && indicator < 100) {
      return 5;
    } else if (indicator > 25 && indicator < 50) {
      return 6;
    } else {
      return 7;
    }
  }
}
