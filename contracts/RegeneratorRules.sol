// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { Regenerator, Pool, Coordinates, RegenerationScore } from "./types/RegeneratorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { RegeneratorPool } from "./RegeneratorPool.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @title RegeneratorRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Regenerator" users
 * within the system. Regenerators are individuals, families, or groups providing ecosystem
 * regeneration services to an area.
 * @dev Inherits functionalities from `Ownable` (for contract deploy setup) and `Callable` (for whitelisted
 * function access). It interacts with `CommunityRules` for general user management and `RegeneratorPool`
 * for reward distribution. This contract handles regenerator registration, area management (coordinates,
 * total area), regeneration score tracking, inspection processes, and penalty management.
 */
contract RegeneratorRules is Callable {
  // --- Contants & state Variables ---

  /// @notice The minimum number of successful inspections a regenerator must have
  /// to be eligible for rewards from the Regenerator Pool.
  uint8 internal constant MINIMUM_INSPECTION_TO_POOL = 3;

  /// @notice A mapping from a regenerator's wallet address to their detailed `Regenerator` data structure.
  /// This serves as the primary storage for regenerator profiles.
  mapping(address => Regenerator) public regenerators;

  /// @notice A mapping from a unique regenerator ID to their corresponding wallet address.
  /// Facilitates lookup of a regenerator's address by their ID.
  mapping(uint256 => address) public regeneratorsAddress;

  /// @notice A mapping from a regenerator's wallet address to an array of coordinate points
  /// defining the boundaries of their regeneration area.
  mapping(address => Coordinates[]) public coordinates;

  /// @notice A mapping from a regenerator's wallet address to their project description.
  mapping(address => string) public projectDescriptions;

  /// @notice A mapping to track if a regenerator is an "impact regenerator" (has successfully
  /// completed at least treee inspections).
  mapping(address => bool) public impactRegenerators;

  /// @notice A mapping from a regenerator's wallet address to a hash or identifier of their area photo.
  mapping(address => string) public areaPhoto;

  /// @notice The address of the `CommunityRules` contract, used to interact with
  /// community-wide rules and user types.
  CommunityRules internal communityRules;

  /// @notice The address of the `RegeneratorPool` contract, responsible for managing
  /// and distributing token rewards to regenerators.
  RegeneratorPool internal regeneratorPool;

  /// @notice The specific `UserType` enumeration value for a Regenerator user.
  UserType private constant USER_TYPE = UserType.REGENERATOR;

  /// @notice The total count of regenerators who are considered "impact regenerators"
  /// (have achieved the minimum of three inspections.
  uint256 public totalImpactRegenerators;

  /// @notice The grand total sum of all regeneration area (in square meters [m²])
  /// managed by all registered regenerators in the system.
  uint256 public regenerationArea;

  // --- Constructor ---

  /**
   * @dev Initializes the ContributorRules contract with key parameters.
   * @param communityRulesAddress The address of the deployed `CommunityRules` contract.
   * @param regeneratorPoolAddress The address of the deployed `RegeneratorPool` contract.
   */
  constructor(address communityRulesAddress, address regeneratorPoolAddress) {
    communityRules = CommunityRules(communityRulesAddress);
    regeneratorPool = RegeneratorPool(regeneratorPoolAddress);
  }

  // --- Public Functions (State modifying) ---

  /**
   * @dev Allows a user to attempt to register as a regenerator.
   * Creates a new `Regenerator` profile for the caller if all requirements are met.
   * @notice Registers a new regenerator and their area of regeneration within the system.
   * This area can be subject to inspections and potential rewards.
   *
   * Requirements:
   * - The caller (`msg.sender`) must not already be a registered regenerator.
   * - The `name` string must not exceed `MAX_NAME_LENGTH` (50) characters in byte length.
   * - The `proofPhoto` string must not exceed `MAX_PROOF_PHOTO_LENGTH` (100) characters in byte length.
   * - The `projectDescription` string must not exceed `MAX_PROJECT_DESCRIPTION_LENGTH` (200) characters in byte length.
   * - The `_coordinates` array must contain between (3) and (10) points.
   * - The `totalArea` must be between (500) and (500,000) square meters [m²].
   * @param totalArea The total area (in square meters [m²]) to be registered.
   * @param name The chosen name for the regenerator.
   * @param proofPhoto A hash or identifier for the regenerator's identity verification photo.
   * @param projectDescription A brief description of the regeneration project.
   * @param _coordinates An array of coordinate points defining the boundaries of the regeneration area.
   */
  function addRegenerator(
    uint256 totalArea,
    string memory name,
    string memory proofPhoto,
    string memory projectDescription,
    Coordinates[] memory _coordinates
  ) public {
    require(
      bytes(name).length <= 50 && bytes(proofPhoto).length <= 100 && bytes(projectDescription).length <= 200,
      "Max characters reached"
    );
    require(_coordinates.length >= 3 && _coordinates.length <= 10, "Minimum 3 and maximum 10 coordinate points");
    require(totalArea >= 500 && totalArea <= 500000, "Minimum 500 and maximum 500.000 square meters");

    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    regenerators[msg.sender] = Regenerator(
      id,
      msg.sender,
      name,
      proofPhoto,
      totalArea,
      false,
      0,
      0,
      RegenerationScore(0),
      Pool(false, regeneratorPool.currentContractEra()),
      0,
      _coordinates.length
    );

    regeneratorsAddress[id] = msg.sender;
    projectDescriptions[msg.sender] = projectDescription;
    communityRules.addUser(msg.sender, USER_TYPE);

    // Update global regeneration area.
    regenerationArea += totalArea;

    // Store coordinates.
    for (uint256 i = 0; i < _coordinates.length; i++) {
      coordinates[msg.sender].push(_coordinates[i]);
    }

    // Emit an event.
    emit RegeneratorRegistered(id, msg.sender, name, totalArea, block.number);
  }

  /**
   * @dev Allows a regenerator to initiate a withdrawal of Regeneration Credits
   * based on their completed inspections and current era.
   * @notice Regenerators can claim tokens for their regeneration service, provided they meet
   * the minimum inspection threshold and are eligible for the current era.
   * To win more tokens, regenerators must plant more trees from different species.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `REGENERATOR`.
   * - The regenerator must have completed at least (3) inspections.
   * - The regenerator must have a positive regeneration score.
   * - The regenerator's current era (`regenerator.pool.currentEra`) will be incremented upon successful withdrawal attempt.
   */
  function withdraw() public {
    // Only registered regenerators can call this function.
    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators pool");

    Regenerator storage regenerator = regenerators[msg.sender];
    // Check if the regenerator has completed the minimum required inspections.
    require(minimumInspections(regenerator.totalInspections), "Minimum inspections");

    // Current regenerator era before withdraw
    uint256 currentEra = regenerator.pool.currentEra;

    // Increment the regenerator's era in their local pool data.
    regenerator.pool.currentEra = currentEra + 1;

    // Call the RegeneratorPool contract to perform the actual token withdrawal.
    regeneratorPool.withdraw(msg.sender, currentEra);

    // Emit an event for off-chain monitoring.
    emit RegeneratorWithdrawalInitiated(msg.sender, currentEra, block.number);
  }

  /**
   * @notice Allows a regenerator to update their area photo for their regeneration area.
   * @param newPhoto The new hash or identifier of the area photo.
   *
   * Requirements:
   * - The `newPhoto` string must not exceed 100 characters in byte length.
   * - The caller (`msg.sender`) must be a registered `REGENERATOR`.
   */
  function updateAreaPhoto(string memory newPhoto) public {
    require(bytes(newPhoto).length <= 100, "Max 100 characters");
    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators");

    areaPhoto[msg.sender] = newPhoto;
  }

  // --- MustBeAllowedCaller Functions (State modifying) ---

  /**
   * @dev Allows an authorized caller to remove levels from a regenerator's pool.
   * This function updates the regenerator's local regeneration score and notifies the `RegeneratorPool` contract.
   * @notice Can only be called by the ValidatorRules address. If `levelsToRemove` is 0,
   * this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.
   *
   * Requirements:
   * - Only addresses whitelisted via `Callable` can call this function.
   * @param addr The wallet address of the regenerator from whom levels are to be removed.
   * @param levelsToRemove The number of levels/score points to decrease. If `0`, the regenerator's
   * regeneration score is reset to `0`, and their area is decremented from the total `regenerationArea`.
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
   * @dev Allows an authorized caller to decrement a regenerator's total completed inspections count.
   * This function is typically called when an inspection previously counted as valid is invalidated.
   * @notice Can only be called by the ValidatorRules address.
   *
   * Requirements:
   * - The regenerator's `totalInspections` count must be greater than 0.
   * - If `totalInspections` becomes 0 after decrement, the regenerator is removed from `impactRegenerators`.
   * @param addr The regenerator's wallet address.
   */
  function decrementInspections(address addr) public mustBeAllowedCaller {
    uint256 totalInspections = regenerators[addr].totalInspections;

    require(totalInspections > 0, "totalInspections invalid");

    if (totalInspections == 1) {
      totalImpactRegenerators--;
      impactRegenerators[addr] = false;
    }

    regenerators[addr].totalInspections--;
  }

  /**
   * @dev Processes actions after a regenerator requests an inspection for their area.
   * Sets the `pendingInspection` status to `true` and records the `lastRequestAt` timestamp.
   * @notice This function is intended to be called by a whitelisted contract, the InspectionRules.
   * @param addr The regenerator's wallet address.
   */
  function afterRequestInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, true);
    lastRequestAt(addr, block.number);
  }

  /**
   * @dev Processes actions after an inspector accepts an inspection request from a regenerator.
   * Sets the regenerator's `pendingInspection` status to `false`.
   * @notice This function is intended to be called by a whitelisted external contract, the InspectorRules.
   * @param addr The regenerator's wallet address.
   */
  function afterAcceptInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, false);
  }

  /**
   * @dev Processes actions after an inspection is successfully realized for a regenerator's area.
   * Increments the regenerator's total inspections and updates their regeneration score.
   * @notice This function is intended to be called by a whitelisted external contract, the InspectionRules
   * after an inspection is completed.
   * @param addr The regenerator's wallet address.
   * @param score The score obtained from the realized inspection, to be added to the regenerator's total score.
   * @return uint256 The updated total number of inspections for the regenerator.
   */
  function afterRealizeInspection(address addr, uint256 score) public mustBeAllowedCaller returns (uint256) {
    uint256 totalInspections = incrementInspections(addr);

    setRegenerationScore(addr, score);

    return totalInspections;
  }

  // --- Internal/private functions ---

  /**
   * @dev Checks if a regenerator has reached the MINIMUM_INSPECTIONS_TO_POOL threshold.
   * @param totalInspections The total number of inspections completed by the regenerator.
   * @return bool `true` if the total inspections meet or exceed the minimum, `false` otherwise.
   */
  function minimumInspections(uint256 totalInspections) private pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTION_TO_POOL;
  }

  /**
   * @dev Internal function to update a regenerator's pending inspection status.
   * @notice Sets whether a regenerator has a pending inspection request (`true`) or not (`false`).
   * @param addr The regenerator's wallet address.
   * @param state The new pending inspection status (`true` for pending, `false` for not pending).
   */
  function pendingInspection(address addr, bool state) private {
    regenerators[addr].pendingInspection = state;
  }

  /**
   * @dev Sets the new regeneration score for a regenerator and potentially adds levels to the pool.
   * @notice This function is called after an inspection is completed and a score is determined.
   * @param addr The regenerator's wallet address.
   * @param regenerationScore The score to add to the regenerator's total regeneration score.
   */
  function setRegenerationScore(address addr, uint256 regenerationScore) private {
    Regenerator storage regenerator = regenerators[addr];
    require(regenerator.id != 0, "Regenerator does not exist");

    // Increment regenerator's total regeneration score.
    regenerator.regenerationScore.score += regenerationScore;

    // If minimum inspections are not met, only update score, not pool level.
    if (!minimumInspections(regenerator.totalInspections)) return;

    uint256 levels = regenerationScore;

    // Logic to add initial levels if the regenerator is entering the contract pool for the first time.
    if (!regenerator.pool.onContractPool) {
      regenerator.pool.onContractPool = true;
      levels = regenerator.regenerationScore.score;
      emit RegeneratorEnteredPool(addr, block.number); // Emit event for entering pool
    }

    // Add level(s) to the regenerator pool.
    regeneratorPool.addLevel(addr, levels);
  }

  /**
   * @dev Internal function to increment a regenerator's total completed inspections count.
   * This also updates the `impactRegenerators` flag and `totalImpactRegenerators` count.
   * @param addr The regenerator's wallet address.
   * @return uint256 The updated total number of inspections for the regenerator.
   */
  function incrementInspections(address addr) private returns (uint256) {
    Regenerator storage regenerator = regenerators[addr];

    regenerator.totalInspections++;

    // Mark as impact regenerator.
    if (!impactRegenerators[addr]) {
      impactRegenerators[addr] = true;
      totalImpactRegenerators++;
    }

    return regenerator.totalInspections;
  }

  /**
   * @dev Internal function to set a regenerator's `lastRequestAt` block.
   * @param addr The regenerator's wallet address.
   * @param blockNumber The block number at which the last request was made.
   */
  function lastRequestAt(address addr, uint256 blockNumber) private {
    regenerators[addr].lastRequestAt = blockNumber;
  }

  /**
   * @dev Internal function to decrement the global `regenerationArea` when a regenerator's
   * area is removed (due to invalidation).
   * @param addr The regenerator's wallet address whose area is to be decremented.
   *
   * Requirements:
   * - The regenerator must exist.
   * - The `totalArea` of the regenerator must be accurately reflected in `regenerationArea`.
   */
  function decrementArea(address addr) internal {
    regenerationArea -= regenerators[addr].totalArea;
  }

  // --- View Functions ---

  /**
   * @dev Returns the detailed `Regenerator` data for a given address.
   * @notice Provides the full profile of a regenerator.
   * @param addr The address of the regenerator to retrieve.
   * @return regenerator The `Regenerator` struct containing the user's data.
   */
  function getRegenerator(address addr) public view returns (Regenerator memory regenerator) {
    return regenerators[addr];
  }

  /**
   * @dev Returns the current era as determined by the `RegeneratorPool` contract.
   * @notice This function provides the current era from the perspective of the reward pool,
   * which is essential for era-based eligibility and reward calculations for regenerators.
   * @return uint256 The current era of the `RegeneratorPool`.
   */
  function poolCurrentEra() public view returns (uint256) {
    return regeneratorPool.currentContractEra();
  }

  /**
   * @dev Calculates the number of blocks remaining until the start of the next era,
   * according to the `RegeneratorPool` contract's era definition.
   * @notice Provides a countdown to the next era for regenerator planning.
   * @return uint256 The amount of blocks remaining until the next era begins.
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(regeneratorPool.nextEraIn(poolCurrentEra()));
  }

  /**
   * @dev Returns the grand total sum of all regeneration area (in square meters [m²])
   * managed by all registered regenerators in the system.
   * @return uint256 The total regeneration area in square meters [m²].
   */
  function regenerationTotalArea() public view returns (uint256) {
    return regenerationArea;
  }

  /**
   * @dev Returns all coordinate points defining a regenerator's area.
   * @param addr The regenerator's wallet address.
   * @return Coordinates[] An array of `Coordinates` structs representing the regenerator's area.
   */
  function getCoordinates(address addr) public view returns (Coordinates[] memory) {
    Regenerator memory regenerator = regenerators[addr];
    Coordinates[] memory coordinatesList = new Coordinates[](regenerator.coordinatesCount);
    uint256 coordinatesCount = regenerator.coordinatesCount;

    for (uint256 i = 0; i < coordinatesCount; i++) {
      coordinatesList[i] = coordinates[addr][i];
    }

    return coordinatesList;
  }

  // --- Events ---

  /// @dev Emitted when a new regenerator successfully registers.
  /// @param id The unique ID of the newly registered regenerator.
  /// @param regeneratorAddress The wallet address of the regenerator.
  /// @param name The name provided by the regenerator.
  /// @param totalArea The total area (in square meters) managed by the regenerator.
  /// @param blockNumber The block number at which the registration occurred.
  event RegeneratorRegistered(
    uint256 indexed id,
    address indexed regeneratorAddress,
    string name,
    uint256 totalArea,
    uint256 blockNumber
  );

  /// @dev Emitted when a regenerator successfully initiates a withdrawal of tokens.
  /// @param regeneratorAddress The address of the regenerator initiating the withdrawal.
  /// @param era The era for which the withdrawal was initiated.
  /// @param blockNumber The block number at which the withdrawal was initiated.
  event RegeneratorWithdrawalInitiated(address indexed regeneratorAddress, uint256 indexed era, uint256 blockNumber);

  /// @dev Emitted when a regenerator initially enters the contract's reward pool
  /// by meeting the minimum inspection criteria and `onContractPool` is set to true.
  /// @param regeneratorAddress The address of the regenerator entering the pool.
  /// @param blockNumber The block number at which the regenerator entered the pool.
  event RegeneratorEnteredPool(address indexed regeneratorAddress, uint256 blockNumber);
}
