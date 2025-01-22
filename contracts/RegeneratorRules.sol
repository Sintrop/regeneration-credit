// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { Regenerator, Pool, AreaInformation } from "./types/RegeneratorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { RegeneratorPool } from "./RegeneratorPool.sol";
import { UserType } from "./types/UserTypes.sol";

/**
 * @author Sintrop
 * @title RegeneratorRules
 * @dev Manage regenerator user logic.
 * @notice Person, family or a group of peolpe that are restoring nature
 */
contract RegeneratorRules is Callable {
  uint256 internal constant MINIMUM_INSPECTION_TO_POOL = 3;
  int256 internal constant LIMIT_REGENERATION_SCORE_TO_POOL = 1000;

  mapping(address => Regenerator) public regenerators;

  UserRules internal userRules;
  RegeneratorPool internal regeneratorPool;

  address[] internal regeneratorsAddress;
  UserType private constant USER_TYPE = UserType.REGENERATOR;
  uint256 public regeneratorsSustainable;

  constructor(address userRulesAddress, address regeneratorPoolAddress) {
    userRules = UserRules(userRulesAddress);
    regeneratorPool = RegeneratorPool(regeneratorPoolAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a regenerator
   * @param name The name of the regenerator
   * @param proofPhoto Identity photo
   * @param totalArea in hectares = 1 he = 10.000 m2
   * @param coordinates the coordinates of the regenerator area
   */
  function addRegenerator(
    uint256 totalArea,
    string memory name,
    string memory proofPhoto,
    string memory coordinates
  ) public {
    Regenerator memory regenerator = regenerators[msg.sender];

    regenerator.id = userRules.userTypesCount(USER_TYPE) + 1;
    regenerator.regeneratorWallet = msg.sender;
    regenerator.name = name;
    regenerator.proofPhoto = proofPhoto;
    regenerator.areaInformation = AreaInformation(coordinates, totalArea);
    regenerator.pool = Pool(false, regeneratorPool.currentContractEra());
    regenerator.createdAt = block.number;

    regenerators[msg.sender] = regenerator;
    regeneratorsAddress.push(msg.sender);
    userRules.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Returns all registered regenerators
   * @return Regenerator struct array
   */
  function getRegenerators() public view returns (Regenerator[] memory) {
    uint256 usersCount = userRules.userTypesCount(USER_TYPE);
    Regenerator[] memory regeneratorList = new Regenerator[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = regeneratorsAddress[i];
      regeneratorList[i] = regenerators[acAddress];
    }

    return regeneratorList;
  }

  /**
   * @dev Return a specific regenerator
   * @param addr the address of the regenerator.
   */
  function getRegenerator(address addr) public view returns (Regenerator memory regenerator) {
    return regenerators[addr];
  }

  /**
   * @dev Call withdraw function from regeneratorPool to try to claim tokens
   * @notice Withdraw regeneration credit from regeneration service provided
   */
  function withdraw() public {
    require(userRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators pool");

    Regenerator memory regenerator = regenerators[msg.sender];
    require(minimumInspections(regenerator.totalInspections), "Minimum inspections");

    regenerators[msg.sender].pool.currentEra++;

    regeneratorPool.withdraw(msg.sender, regenerator.pool.currentEra);
  }

  /**
   * @dev Checks if regenerator reached minimum inspections
   * @param totalInspections regenerator total received inspections
   * @return bool True if reached
   */
  function minimumInspections(uint256 totalInspections) private pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTION_TO_POOL;
  }

  /**
   * @dev Checks if regenerator reached maxiumum score
   * @param regenerator The regenerator
   * @return bool True if reached
   */
  function limitRegenerationScore(Regenerator memory regenerator) private pure returns (bool) {
    return regenerator.regenerationScore.score >= LIMIT_REGENERATION_SCORE_TO_POOL;
  }

  /**
   * @dev Check if a specific regenerator exists
   * @param addr Regenerator address
   * @return a bool that represent if a regenerator exists or not
   */
  function regeneratorExists(address addr) public view returns (bool) {
    return regenerators[addr].id > 0;
  }

  /**
   * @dev Checks if regenerator has pending inspection
   */
  function pendingInspection(address addr, bool state) private {
    regenerators[addr].pendingInspection = state;
  }

  /**
   * @dev Check if a specific regenerator reached the maximum score
   * @param addr Regenerator address
   * @return a bool that represent if a regenerator is sustainable or not
   */
  function isSustainable(address addr) public view returns (bool) {
    return regenerators[addr].regenerationScore.sustainable;
  }

  /**
   * @dev Set the new regeneration score
   * @param addr Regenerator address
   * @param regenerationScore New score
   */
  function setRegenerationScore(address addr, int256 regenerationScore) private {
    Regenerator memory regenerator = regenerators[addr];

    int256 beforeRegenerationScore = regenerator.regenerationScore.score;
    regenerator.regenerationScore.score += regenerationScore;
    regenerators[addr] = regenerator;

    if (limitRegenerationScore(regenerator)) changeRegeneratorToSustainable(regenerator);
    if (!minimumInspections(regenerator.totalInspections)) return;
    if (regenerationScore > 0) addRegenerationScore(regenerator, beforeRegenerationScore, regenerationScore);
    if (regenerationScore < 0) removeRegenerationScore(regenerator, regenerationScore);
  }

  function addRegenerationScore(
    Regenerator memory regenerator,
    int256 beforeRegenerationScore,
    int256 regenerationScore
  ) private {
    if (regenerator.regenerationScore.score <= 0) return;
    uint256 levels;

    bool newScoreMakeRegeneratorPositive = beforeRegenerationScore < 0;

    if (newScoreMakeRegeneratorPositive) {
      levels = uint256(regenerator.regenerationScore.score);
    } else {
      levels = regenerator.pool.onContractPool
        ? uint256(regenerationScore)
        : uint256(regenerator.regenerationScore.score);
    }

    if (!regenerator.pool.onContractPool) regenerators[regenerator.regeneratorWallet].pool.onContractPool = true;
    regeneratorPool.addLevel(regenerator.regeneratorWallet, levels);
  }

  function removeRegenerationScore(Regenerator memory regenerator, int256 regenerationScore) internal {
    if (!regenerator.pool.onContractPool) return;

    regeneratorPool.removeLevel(regenerator.regeneratorWallet, uint256(-(regenerationScore)));
  }

  /**
   * @dev Remove pool levels from regenerator
   * @param addr Regenerator wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Regenerator memory regenerator = regenerators[addr];

    if (removeSomeLevels == 0) regenerators[addr].regenerationScore.score = 0;
    if (removeSomeLevels > 0) regenerators[addr].regenerationScore.score -= int256(removeSomeLevels);

    regeneratorPool.removePoolLevels(addr, regenerator.pool.currentEra, removeSomeLevels);
  }

  function removeNegativeScore(address addr, int256 levels) public mustBeAllowedCaller {
    regenerators[addr].regenerationScore.score += levels;
    regeneratorPool.addLevel(addr, uint256(levels));
  }

  function changeRegeneratorToSustainable(Regenerator memory regenerator) internal {
    regeneratorsSustainable++;
    regenerators[regenerator.regeneratorWallet].regenerationScore.sustainable = true;
  }

  function incrementInspections(address addr) private returns (uint256) {
    regenerators[addr].totalInspections++;

    return regenerators[addr].totalInspections;
  }

  function decrementInspections(address addr) public mustBeAllowedCaller {
    require(regenerators[addr].totalInspections > 0, "totalInspections invalid");

    regenerators[addr].totalInspections--;
  }

  function afterRequestInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, true);
    lastRequestAt(addr, block.number);
  }

  function afterAcceptInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, false);
  }

  function afterRealizeInspection(address addr, int256 score) public mustBeAllowedCaller returns (uint256) {
    uint256 totalInspections = incrementInspections(addr);

    setRegenerationScore(addr, score);

    return totalInspections;
  }

  function lastRequestAt(address addr, uint256 blocksNumber) private {
    regenerators[addr].lastRequestAt = blocksNumber;
  }

  /**
   * @dev Current regeneratorPool era
   * @return uint256 Return the current contract pool era
   */
  function regeneratorPoolEra() public view returns (uint256) {
    return regeneratorPool.currentContractEra();
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(regeneratorPool.nextEraIn(regeneratorPoolEra()));
  }
}
