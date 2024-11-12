// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, IsasDescription, Isa } from "./types/CategoryTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IsaInspection } from "./types/InspectionTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Manage index categories and score
 */
contract CategoryContract is Ownable, Callable {
  mapping(uint256 => Category) public categories;
  mapping(uint256 => IsasDescription[]) public categoryIsaDescriptions;
  mapping(uint256 => Isa) public isas;

  uint256 public categoryCounts;

  constructor() {
    isas[1] = Isa("REGENERATIVO 6", 25);
    isas[2] = Isa("REGENERATIVO 5", 16);
    isas[3] = Isa("REGENERATIVO 4", 8);
    isas[4] = Isa("REGENERATIVO 3", 4);
    isas[5] = Isa("REGENERATIVO 2", 2);
    isas[6] = Isa("REGENERATIVO 1", 1);
    isas[7] = Isa("NEUTRO", 0);
    isas[8] = Isa("NOT_REGENERATIVE 1", -1);
    isas[9] = Isa("NOT_REGENERATIVE 2", -2);
    isas[10] = Isa("NOT_REGENERATIVE 3", -4);
    isas[11] = Isa("NOT_REGENERATIVE 4", -8);
    isas[12] = Isa("NOT_REGENERATIVE 5", -16);
    isas[13] = Isa("NOT_REGENERATIVE 6", -25);
  }

  /**
   * @dev add a new category
   * @param name Category name
   * @param description Category description
   * @param isasDescriptions IsasDescription[]
   * @return bool
   */
  function addCategory(
    string memory name,
    string memory description,
    IsasDescription[] memory isasDescriptions
  ) public onlyOwner returns (bool) {
    Category memory category = Category(categoryCounts + 1, name, description);

    categories[category.id] = category;
    categoryCounts++;

    for (uint256 i = 0; i < isasDescriptions.length; i++) {
      categoryIsaDescriptions[category.id].push(isasDescriptions[i]);
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
   * @dev Returns all added category isa description
   * @return IsasDescription struct array
   */
  function getCategoryIsaDescription(uint256 categoryId) public view returns (IsasDescription[] memory) {
    return categoryIsaDescriptions[categoryId];
  }

  function calculateScore(IsaInspection[] memory _isaInspections) public view returns (int256) {
    int256 isaScore;
    Isa memory isa;
    Category memory category;
    bool valid = true;

    for (uint8 i = 0; i < _isaInspections.length; i++) {
      isa = isas[_isaInspections[i].isaId];
      category = categories[_isaInspections[i].categoryId];

      if (category.id != i + 1 || bytes(isa.isaName).length <= 0) {
        valid = false;
        break;
      }

      isaScore += isa.isaValue;
    }

    require(valid, "Category or Isa do not exists");

    return isaScore;
  }
}
