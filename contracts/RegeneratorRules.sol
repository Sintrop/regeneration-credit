// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { Regenerator, Pool, Coordinates } from "./types/RegeneratorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { RegeneratorPool } from "./RegeneratorPool.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @author Sintrop
 * @title RegeneratorRules
 * @dev Manage regenerator user logic.
 * @notice Person, family or a group of people that are providing ecosystem regeneration services
 */
contract RegeneratorRules is Callable {
  /// @notice Minimum inspections to regenerator receive tokens
  uint256 internal constant MINIMUM_INSPECTION_TO_POOL = 3;

  /// @notice The relationship between address and regenerator data
  mapping(address => Regenerator) public regenerators;

  /// @notice The relationship between id and regenerator address
  mapping(uint256 => address) public regeneratorsAddress;

  /// @notice The relationship between address and coordinates array
  mapping(address => Coordinates[]) public coordinates;

  /// @notice Number of approved impact regenerators
  mapping(address => bool) public impactRegenerators;

  mapping(address => string) public areaPhoto;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice RegeneratorPool contract address
  RegeneratorPool internal regeneratorPool;

  /// @notice Regenerator UserType
  UserType private constant USER_TYPE = UserType.REGENERATOR;

  /// @notice Valid impact regenerators
  uint256 public totalImpactRegenerators;

  /// @notice [m²]
  uint256 public regenerationArea;

  constructor(address communityRulesAddress, address regeneratorPoolAddress) {
    communityRules = CommunityRules(communityRulesAddress);
    regeneratorPool = RegeneratorPool(regeneratorPoolAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a regenerator
   *
   * Requirements:
   *
   * - the caller must have been invited before
   * - vacancies according to the number of regenerators
   *
   * @notice Register as a regenerator to add to the system an area under your supervision that is in process of regeneration
   * @param name The name of the regenerator
   * @param proofPhoto Identity photo
   * @param totalArea in square meters [m²]
   * @param _coordinates the coordinates of the regenerator area
   */
  function addRegenerator(
    uint256 totalArea,
    string memory name,
    string memory proofPhoto,
    Coordinates[] memory _coordinates
  ) public {
    require(bytes(name).length <= 50 && bytes(proofPhoto).length <= 100, "Max 100 characters");
    require(_coordinates.length >= 3 && _coordinates.length <= 10, "Minimum 3 and maximum 10 coordinate points");
    require(totalArea >= 500 && totalArea <= 500000, "Minimum 500 and maximum 500.000 square meters");

    Regenerator memory regenerator = regenerators[msg.sender];
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    regenerator.id = id;
    regenerator.regeneratorWallet = msg.sender;
    regenerator.name = name;
    regenerator.proofPhoto = proofPhoto;
    regenerator.totalArea = totalArea;
    regenerator.pool = Pool(false, regeneratorPool.currentContractEra());
    regenerator.createdAt = block.number;
    regenerator.coordinatesCount = _coordinates.length;

    regenerators[msg.sender] = regenerator;
    regeneratorsAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);

    regenerationArea += totalArea;

    for (uint256 i = 0; i < _coordinates.length; i++) {
      coordinates[msg.sender].push(_coordinates[i]);
    }
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
    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators pool");

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
   * @dev Set the new regeneration score
   * @param addr Regenerator address
   * @param regenerationScore New score
   */
  function setRegenerationScore(address addr, uint256 regenerationScore) private {
    Regenerator memory regenerator = regenerators[addr];

    regenerator.regenerationScore.score += regenerationScore;
    regenerators[addr] = regenerator;

    if (!minimumInspections(regenerator.totalInspections)) return;

    uint256 levels = regenerationScore;

    if (!regenerator.pool.onContractPool) {
      regenerators[addr].pool.onContractPool = true;
      levels = regenerator.regenerationScore.score;
    }

    regeneratorPool.addLevel(addr, levels);
  }

  /**
   * @dev Remove pool levels from regenerator
   * @param addr Regenerator wallet
   * @param levelsToRemove Levels to be removed, when 0 the user is being blocked
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    if (levelsToRemove == 0) {
      regenerators[addr].regenerationScore.score = 0;
      decrementArea(addr);
    } else {
      regenerators[addr].regenerationScore.score -= levelsToRemove;
    }

    regeneratorPool.removePoolLevels(addr, levelsToRemove);
  }

  /**
   * @dev Increment regenerator total inspections
   * @param addr Regenerator wallet
   */
  function incrementInspections(address addr) private returns (uint256) {
    regenerators[addr].totalInspections++;

    if (!impactRegenerators[addr]) {
      impactRegenerators[addr] = true;
      totalImpactRegenerators++;
    }

    return regenerators[addr].totalInspections;
  }

  /**
   * @dev Decrement regenerator total inspections
   * @param addr Regenerator wallet
   */
  function decrementInspections(address addr) public mustBeAllowedCaller {
    require(regenerators[addr].totalInspections > 0, "totalInspections invalid");

    if (regenerators[addr].totalInspections == 1) {
      totalImpactRegenerators--;
      impactRegenerators[addr] = false;
    }

    regenerators[addr].totalInspections--;
  }

  /**
   * @dev Actions after regenerator request inspection
   * @param addr Regenerator wallet
   */
  function afterRequestInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, true);
    lastRequestAt(addr, block.number);
  }

  /**
   * @dev Actions after inspector accept inspection
   * @param addr Inspector wallet
   */
  function afterAcceptInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, false);
  }

  /**
   * @dev Actions after realize inspection.
   * @param addr Regenerator wallet
   */
  function afterRealizeInspection(address addr, uint256 score) public mustBeAllowedCaller returns (uint256) {
    uint256 totalInspections = incrementInspections(addr);

    setRegenerationScore(addr, score);

    return totalInspections;
  }

  /**
   * @dev Set regenerator lastRequestAt after request inspection.
   * @param addr Regenerator wallet
   */
  function lastRequestAt(address addr, uint256 blocksNumber) private {
    regenerators[addr].lastRequestAt = blocksNumber;
  }

  /**
   * @dev Current regeneratorPool era
   * @return uint256 Return the current contract pool era
   */
  function poolCurrentEra() public view returns (uint256) {
    return regeneratorPool.currentContractEra();
  }

  /**
   * @notice Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(regeneratorPool.nextEraIn(poolCurrentEra()));
  }

  /**
   * @notice Total regeneration area
   * @return uint256 Return the regeneration area [m²]
   */
  function regenerationTotalArea() public view returns (uint256) {
    return regenerationArea;
  }

  /**
   * @dev Function to decrement invalidated regenerator area
   * @param addr Regenerator address
   */
  function decrementArea(address addr) internal {
    regenerationArea -= regenerators[addr].totalArea;
  }

  /**
   * @dev Function to get all regenerator coordinate points
   * @param addr Regenerator wallet
   * @return Coordinates Returns an array of coordinates
   */
  function getCoordinates(address addr) public view returns (Coordinates[] memory) {
    Regenerator memory regenerator = regenerators[addr];
    Coordinates[] memory coordinatesList = new Coordinates[](regenerator.coordinatesCount);

    for (uint256 i = 0; i < regenerator.coordinatesCount; i++) {
      coordinatesList[i] = coordinates[addr][i];
    }

    return coordinatesList;
  }

  /**
   * @notice Update your profile photo
   * @param newPhoto newPhoto hash
   */
  function updateAreaPhoto(string memory newPhoto) public {
    require(bytes(newPhoto).length <= 100, "Max 100 characters");
    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators");

    areaPhoto[msg.sender] = newPhoto;
  }
}
