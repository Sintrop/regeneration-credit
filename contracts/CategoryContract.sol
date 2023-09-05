// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Isas, Category } from "./types/CategoryTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Category resource that is a part of Sintrop logic
 */
contract CategoryContract is Ownable {

  mapping(uint256 => Category) public categories;
  mapping(address => mapping(uint256 => uint256)) public voted;

  Category public category;
  uint256 public categoryCounts;

  /**
   * @dev add a new category
   * @param name the name of category
   * @param description the description of category
   * @param tutorial how inspectors should evaluate it.
   * @param regenerative3 the description text to this metric
   * @param regenerative2 the description text to this metric
   * @param regenerative1 the description text to this metric
   * @param neutro the description text to this metric
   * @param notRegenerative1 the description text to this metric
   * @param notRegenerative2 the description text to this metric
   * @param notRegenerative3 the description text to this metric
   * @return bool
   */
  function addCategory(
    string memory name,
    string memory description,
    string memory tutorial,
    string memory regenerative3,
    string memory regenerative2,
    string memory regenerative1,
    string memory neutro,
    string memory notRegenerative1,
    string memory notRegenerative2,
    string memory notRegenerative3
  ) public onlyOwner returns (bool) {
    category = Category(
      categoryCounts + 1,
      msg.sender,
      name,
      description,
      tutorial,
      regenerative3,
      regenerative2,
      regenerative1,
      neutro,
      notRegenerative1,
      notRegenerative2,
      notRegenerative3,
      0
    );

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
