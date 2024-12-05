// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, RegenerationIndex, RegenerationIndexDescription } from "./types/CategoryTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { RegenerationInspection } from "./types/InspectionTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Manage index categories and score
 */
contract CategoryContract is Ownable, Callable {
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
    regenerationIndex[8] = RegenerationIndex("NOT_REGENERATIVE 1", -1);
    regenerationIndex[9] = RegenerationIndex("NOT_REGENERATIVE 2", -2);
    regenerationIndex[10] = RegenerationIndex("NOT_REGENERATIVE 3", -4);
    regenerationIndex[11] = RegenerationIndex("NOT_REGENERATIVE 4", -8);
    regenerationIndex[12] = RegenerationIndex("NOT_REGENERATIVE 5", -16);
    regenerationIndex[13] = RegenerationIndex("NOT_REGENERATIVE 6", -25);
  }

  /**
   * @dev add a new index category
   * @param name Category name
   * @param description Category description
   * @param regenerationIndexDescriptions RegenerationIndexDescription[]
   * @return bool
   */
  function addCategory(
    string memory name,
    string memory description,
    RegenerationIndexDescription[] memory regenerationIndexDescriptions
  ) public onlyOwner returns (bool) {
    Category memory category = Category(categoryCounts + 1, name, description);

    categories[category.id] = category;
    categoryCounts++;

    for (uint256 i = 0; i < regenerationIndexDescriptions.length; i++) {
      categoryRegenerationIndexDescriptions[category.id].push(regenerationIndexDescriptions[i]);
    }

    return true;
  }

  /**
   * @dev Returns all added categories
   * @return category struc array
   */
  function getCategories() public view returns (Category[] memory) {
    uint256 count = categoryCounts;
    Category[] memory categoriesList = new Category[](count);

    for (uint256 i = 0; i < count; i++) {
      categoriesList[i] = categories[i + 1];
    }

    return categoriesList;
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
