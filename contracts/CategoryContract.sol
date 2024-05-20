// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, IsasDescription, Isa } from "./types/CategoryTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IsaInspection } from "./types/InspectionTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Category resource that is a part of Sintrop logic
 */
contract CategoryContract is Ownable, Callable {
  mapping(uint256 => Category) public categories;
  mapping(uint256 => IsasDescription[]) public categoryIsaDescriptions;
  mapping(uint256 => IsaInspection[]) public isaInspections;
  mapping(uint256 => Isa) public isas;

  Category public category;
  uint256 public categoryCounts;

  constructor() {
    isas[1] = Isa("REGENERATIVO 3", 25);
    isas[2] = Isa("REGENERATIVO 2", 10);
    isas[3] = Isa("REGENERATIVO 1", 1);
    isas[4] = Isa("NEUTRO", 0);
    isas[5] = Isa("NOT_REGENERATIVE 1", -1);
    isas[6] = Isa("NOT_REGENERATIVE 2", -10);
    isas[7] = Isa("NOT_REGENERATIVE 3", -25);
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
    category = Category(categoryCounts + 1, name, description);

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

  /**
   * @dev List IsaInspection from inspection
   * @param inspectionId The id of the inspection to get IsaInspection
   */
  function getIsa(uint256 inspectionId) public view returns (IsaInspection[] memory) {
    return isaInspections[inspectionId];
  }

  function calculateIsa(
    uint256 inspectionId,
    IsaInspection[] memory _isaInspections
  ) external mustBeAllowedCaller returns (int256) {
    int256 isaScore;

    for (uint8 i = 0; i < _isaInspections.length; i++) {
      Isa memory isa = isas[_isaInspections[i].isaId];
      Category memory currentCategory = categories[_isaInspections[i].categoryId];

      require(currentCategory.id > 0 && bytes(isa.isaName).length > 0, "Category or Isa do not exists");

      isaInspections[inspectionId].push(_isaInspections[i]);

      isaScore += isa.isaValue;
    }

    return isaScore;
  }
}
