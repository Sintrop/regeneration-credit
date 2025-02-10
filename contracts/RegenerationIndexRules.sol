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
      "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]"
    );

    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(1, "Balance > 100.000"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(2, "100.000 > Balance > 10.000"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(3, "10.000 > Balance > 1000"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(4, "1000 > Balance > 100"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(5, "100 > Balance > 10"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(6, "10 > Balance > 0"));
    categoryRegenerationIndexDescriptions[2].push(RegenerationIndexDescription(7, "Not applicable"));

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
   * @param _regenerationInspection Inspection result provided by inspector
   * @return int256 Inspection score
   */
  function calculateScore(RegenerationInspection[] memory _regenerationInspection) public view returns (int256) {
    int256 regenerationScore;
    RegenerationIndex memory regeneration;
    Category memory category;
    bool valid = true;

    for (uint8 i = 0; i < _regenerationInspection.length; i++) {
      regeneration = regenerationIndex[_regenerationInspection[i].regenerationIndexId];
      category = categories[_regenerationInspection[i].categoryId];

      if (category.id != i + 1 || bytes(regeneration.name).length <= 0) {
        valid = false;
        break;
      }

      regenerationScore += regeneration.value;
    }

    require(valid, "Category or Regeneration Index do not exists");

    return regenerationScore;
  }
}
