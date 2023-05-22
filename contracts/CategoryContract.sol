// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolPassiveInterface } from "./PoolPassiveInterface.sol";
import { Isas, Category } from "./types/CategoryTypes.sol";
import { ResearcherContract } from "./ResearcherContract.sol";
import { UserContract } from "./UserContract.sol";

/**
 * @author Sintrop
 * @title CategoryContract
 * @dev Category resource that is a part of Sintrop business
 */
contract CategoryContract {
  uint256 public constant LIMIT_VOTING = 100000000000000000000000;

  mapping(uint256 => Category) public categories;
  mapping(uint256 => uint256) public votes;
  mapping(address => mapping(uint256 => uint256)) public voted;

  ResearcherContract public researcherContract;
  UserContract public userContract;

  // TODO: Remove state category (unused)
  Category public category;
  uint256 public categoryCounts;
  PoolPassiveInterface internal isaPool;

  // TODO: Remove researcherContract and use only userContract to check if exists or if is a researcher
  constructor(address _isaPoolAddress, address researcherContractAddress, address userContractAddress) {
    isaPool = PoolPassiveInterface(_isaPoolAddress);
    researcherContract = ResearcherContract(researcherContractAddress);
    userContract = UserContract(userContractAddress);
  }

  // TODO: remove modifier and use require direct in the function (modifier is not reutilized)
  /**
   * @dev add a new category
   * @param name the name of category
   * @param description the description of category
   * @param tutorial how activists should evaluate it.
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
  ) public requireResearcher returns (bool) {
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

  /**
   * @dev Allow a user vote in a category sending tokens amount to this
   * @param id the id of a category that receives a vote.
   * @param tokens the tokens amount that the use want use to vote.
   */
  function vote(uint256 id, uint256 tokens) public requireUserExists categoryMustExists(id) {
    require(isaPool.balanceOf(msg.sender) > tokens, "You don't have tokens to vote");
    require(tokens > 0, "Send at least 1 SAC Token");
    require(voted[msg.sender][id] + tokens <= LIMIT_VOTING, "can't vote more than 100k tokens");

    votes[id] += tokens;
    voted[msg.sender][id] += tokens;
    categories[id].votesCount++;

    isaPool.transferWith(msg.sender, address(isaPool), tokens);
  }

  /**
   * @dev Allow a user unvote in a category and get your tokens again
   * @param id the id of a category that receives a vote.
   */
  function unvote(uint256 id) public categoryMustExists(id) {
    require(voted[msg.sender][id] > 0, "You don't voted to this category");

    uint256 tokens = voted[msg.sender][id];

    votes[id] -= tokens;
    voted[msg.sender][id] = 0;
    categories[id].votesCount--;

    isaPool.transferWith(address(isaPool), msg.sender, tokens);
  }

  // MODIFIERS

  modifier categoryMustExists(uint256 id) {
    require(categories[id].id > 0, "This category don't exists");
    _;
  }

  modifier requireResearcher() {
    require(researcherContract.researcherExists(msg.sender), "Only allowed to researchers");
    _;
  }

  modifier requireUserExists() {
    require(userContract.exists(msg.sender), "Only registered users");
    _;
  }
}
