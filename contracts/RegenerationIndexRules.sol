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
  mapping(uint256 => Category) public categories;
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
    Category memory carbonCategory = Category(
      1,
      "Carbon",
      "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]"
    );

    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(1, "Balance > 100.000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(2, "100.000 > Balance > 10.000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(3, "10.000 > Balance > 1000"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(4, "1000 > Balance > 100"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(5, "100 > Balance > 10"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(6, "10 > Balance > 0"));
    categoryRegenerationIndexDescriptions[1].push(RegenerationIndexDescription(7, "Not applicable"));

    Category memory biodiversity = Category(
      2,
      "Biodiversity",
      "Indicator to measure the level of biodiversity. Our unit is 'unit of life', meaning one species of fauna and flora."
    );

    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(1, "Biodiversity > 1000"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(2, "1000 > Biodiversity > 500"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(3, "500 > Biodiversity > 200"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(4, "200 > Biodiversity > 100"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(5, "100 > Biodiversity > 50"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(6, "50 > Biodiversity > 25"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(7, "Biodiversity < 25"));

    categories[1] = carbonCategory;
    categories[2] = biodiversity;
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
   * @param carbonIndicator Inspection result provided by inspector
   * @param biodiversityIndicator Inspection result provided by inspector
   * @return int256 Inspection score
   */
  function calculateScore(
    RegenerationInspection memory carbonIndicator,
    RegenerationInspection memory biodiversityIndicator
  ) public view returns (uint256) {
    RegenerationIndex memory carbon = regenerationIndex[carbonRegenerationIndexId(carbonIndicator.indicator)];
    RegenerationIndex memory biodiversity = regenerationIndex[
      biodiversityRegenerationIndexId(biodiversityIndicator.indicator)
    ];

    return carbon.value + biodiversity.value;
  }

  function carbonRegenerationIndexId(uint256 indicator) internal pure returns (uint256) {
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
