// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, IsasDescription } from "./types/CategoryTypes.sol";
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
  mapping(uint256 => IsaInspection[]) public isas;

  Category public category;
  uint256 public categoryCounts;

  /**
   * @dev add a new category
   * @param isasDescription IsasDescription
   * @return bool
   */
  function addCategory(IsasDescription memory isasDescription) public onlyOwner returns (bool) {
    category = Category(categoryCounts + 1, isasDescription);

    categories[category.id] = category;
    categoryCounts++;

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
   * @dev List IsaInspection from inspection
   * @param inspectionId The id of the inspection to get IsaInspection
   */
  function getIsa(uint256 inspectionId) public view returns (IsaInspection[] memory) {
    return isas[inspectionId];
  }

  function calculateIsa(uint256 inspectionId, IsaInspection[] memory _isas) external mustBeAllowedCaller returns (int256) {
    int256[7] memory points = [int256(25), 10, 1, 0, -1, -10, -25];
    int256 isaScore;

    for (uint8 i = 0; i < _isas.length; i++) {
      isas[inspectionId].push(_isas[i]);
      uint256 isaIndex = _isas[i].isaIndex;
      isaScore += points[isaIndex];
    }

    return isaScore;
  }
}
