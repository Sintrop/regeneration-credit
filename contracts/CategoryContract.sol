// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Category, IsasDescription } from "./types/CategoryTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Category resource that is a part of Sintrop logic
 */
contract CategoryContract is Ownable {
  mapping(uint256 => Category) public categories;

  Category public category;
  uint256 public categoryCounts;

  /**
   * @dev add a new category
   * @param isasDescription IsasDescription
   * @return bool
   */
  function addCategory(IsasDescription memory isasDescription) public onlyOwner returns (bool) {
    category = Category(categoryCounts + 1, msg.sender, isasDescription, 0);

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
}
