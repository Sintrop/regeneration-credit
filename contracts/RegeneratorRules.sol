// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IRegeneratorPool } from "./interfaces/IRegeneratorPool.sol";
import { Regenerator, Pool, Coordinates, RegenerationScore } from "./types/RegeneratorTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

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
contract RegeneratorRules is Callable, ReentrancyGuard {
  // --- Constants ---

  /// @notice The minimum number of successful inspections a regenerator must have
  /// to be eligible for rewards from the Regenerator Pool.
  uint8 public constant MINIMUM_INSPECTIONS_TO_POOL = 3;

  /// @notice The maximum number of successful inspections a regenerator must have
  /// to conclude the inspection life cycle.
  uint8 public constant MAXIMUM_INSPECTIONS = 6;

  /// @notice Minimum number of coordinate points to define a regeneration area.
  uint8 private constant MIN_COORDINATES_COUNT = 3;

  /// @notice Maximum number of coordinate points to define a regeneration area.
  uint8 private constant MAX_COORDINATES_COUNT = 10;

  /// @notice Maximum inspection score.
  uint8 private constant MAX_SCORE = 64;

  /// @notice Maximum character length for the regenerator's name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Maximum character length for photo URLs or IPFS hashes.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Maximum character length for the project description.
  uint16 private constant MAX_PROJECT_DESCRIPTION_LENGTH = 200;

  /// @notice Minimum total area in square meters (m²) for a regeneration project.
  uint32 public constant MIN_REGENERATION_AREA = 2500;

  /// @notice Maximum total area in square meters (m²) for a regeneration project.
  uint32 public constant MAX_REGENERATION_AREA = 1000000;

  /// @notice The maximum number of active 'Regenerator' type users permitted in the system.
  uint256 public constant MAX_ACTIVE_REGENERATORS = 500000;

  // --- State variables ---

  /// @notice A mapping from a regenerator's wallet address to their detailed `Regenerator` data structure.
  /// This serves as the primary storage for regenerator profiles.
  mapping(address => Regenerator) private regenerators;

  /// @notice A mapping from a unique regenerator ID to their corresponding wallet address.
  /// Facilitates lookup of a regenerator's address by their ID.
  mapping(uint256 => address) public regeneratorsAddress;

  /// @notice A mapping from a regenerator's wallet address to an array of coordinate points
  /// defining the boundaries of their regeneration area.
  mapping(address => Coordinates[]) public coordinates;

  /// @notice A mapping from a regenerator's wallet address to their project description.
  mapping(address => string) public projectDescriptions;

  /// @notice A mapping to track if a regenerator is an "impact regenerator" (has successfully
  /// completed at least one inspections).
  mapping(address => bool) public impactRegenerators;

  /// @notice A mapping to track if a regenerator is a "certified regenerator", a user that has successfully
  /// completed the maximum inspections number, concluding system participation.
  mapping(address => bool) public certifiedRegenerators;

  /// @notice A mapping from a regenerator's wallet address to a hash or identifier of their area photo.
  mapping(address => string) public areaPhoto;

  /// @notice Tracks which inspection IDs have already been processed to prevent replay attacks.
  mapping(uint64 => bool) private processedInspections;

  /// @notice The number of regenerators that have started the certification process on each era,
  /// and have reached the minimum of one inspection.
  mapping(uint256 => uint256) public newCertificationRegenerators;

  /// @notice The address of the `CommunityRules` contract, used to interact with
  /// community-wide rules and user types.
  ICommunityRules public communityRules;

  /// @notice The address of the `RegeneratorPool` contract, responsible for managing
  /// and distributing token rewards to regenerators.
  IRegeneratorPool public regeneratorPool;

  /// @notice The specific `UserType` enumeration value for a Regenerator user.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.REGENERATOR;

  /// @notice The total count of regenerators who have completed the certification process.
  uint256 public totalCertifiedRegenerators;

  /// @notice The grand total sum of all regeneration area (in square meters [m²])
  /// managed by all registered regenerators in the system.
  uint256 public regenerationArea;

  /// @notice The address of the `InspectionRules` contract.
  address public inspectionRulesAddress;

  /// @notice The address of the `InspectionRules` contract.
  address public validationRulesAddress;

  // --- Constructor ---

  /**
   * @dev Initializes the ContributorRules contract with key parameters.
   * @param communityRulesAddress The address of the deployed `CommunityRules` contract.
   * @param regeneratorPoolAddress The address of the deployed `RegeneratorPool` contract.
   */
  constructor(address communityRulesAddress, address regeneratorPoolAddress) {
    communityRules = ICommunityRules(communityRulesAddress);
    regeneratorPool = IRegeneratorPool(regeneratorPoolAddress);
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _inspectionRulesAddress Address of InspectionRules.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _inspectionRulesAddress, address _validationRulesAddress) external onlyOwner {
    inspectionRulesAddress = _inspectionRulesAddress;
    validationRulesAddress = _validationRulesAddress;
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
   * - The `proofPhoto` string must not exceed `MAX_HASH_LENGTH` (150) characters in byte length.
   * - The `projectDescription` string must not exceed `MAX_PROJECT_DESCRIPTION_LENGTH` (200) characters in byte length.
   * - The `_coordinates` array must contain between (3) and (10) points.
   * - The `totalArea` must be between (2500) and (1,000,000) square meters [m²].
   * @param totalArea The total area (in square meters [m²]) to be registered.
   * @param name The chosen name for the regenerator.
   * @param proofPhoto A hash or identifier for the regenerator's identity verification photo.
   * @param projectDescription A brief description of the regeneration project.
   * @param _coordinates An array of coordinate points defining the boundaries of the regeneration area.
   */
  function addRegenerator(
    uint32 totalArea,
    string memory name,
    string memory proofPhoto,
    string memory projectDescription,
    Coordinates[] calldata _coordinates
  ) external {
    require(
      bytes(name).length <= MAX_NAME_LENGTH &&
        bytes(proofPhoto).length <= MAX_HASH_LENGTH &&
        bytes(projectDescription).length <= MAX_PROJECT_DESCRIPTION_LENGTH,
      "Max characters reached"
    );
    require(
      _coordinates.length >= MIN_COORDINATES_COUNT && _coordinates.length <= MAX_COORDINATES_COUNT,
      "Minimum 3 and maximum 10 coordinate points"
    );
    require(
      totalArea >= MIN_REGENERATION_AREA && totalArea <= MAX_REGENERATION_AREA,
      "Minimum 2500 and maximum 1.000.000 square meters"
    );
    require(isRegistrationAllowed(), "Wait for vacancy: Max regenerators limit");

    _validateCoordinates(_coordinates);

    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

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
      block.number,
      _coordinates.length,
      false
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
  function withdraw() external nonReentrant {
    // Only registered regenerators can call this function.
    require(communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, msg.sender), "Only regenerators pool");

    Regenerator storage regenerator = regenerators[msg.sender];
    // Check if the regenerator has completed the minimum required inspections.
    require(_minimumInspections(regenerator.totalInspections), "Minimum inspections");

    // Current regenerator era before withdraw.
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
   * - The `newPhoto` string must not exceed 150 characters in byte length.
   * - The caller (`msg.sender`) must be a registered `REGENERATOR`.
   */
  function updateAreaPhoto(string memory newPhoto) external {
    require(bytes(newPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    require(communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, msg.sender), "Only regenerators");

    areaPhoto[msg.sender] = newPhoto;
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller to remove levels from a regenerator's pool.
   * This function updates the regenerator's local regeneration score and notifies the `RegeneratorPool` contract.
   * @notice Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
   * this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.
   * @param addr The wallet address of the regenerator from whom levels are to be removed.
   */
  function removePoolLevels(
    address addr
  ) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) nonReentrant {
    Regenerator storage regenerator = regenerators[addr];

    require(!regenerator.isFullyInvalidated, "Regenerator already fully invalidated");

    regenerator.isFullyInvalidated = true;

    _decrementArea(addr);

    regeneratorPool.removePoolLevels(addr, 0, true);
  }

  /**
   * @dev Allows an authorized caller to remove levels from a regenerator's pool.
   * This function updates the regenerator's local regeneration score and notifies the `RegeneratorPool` contract.
   * @notice Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
   * this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.
   * @param addr The wallet address of the regenerator from whom levels are to be removed.
   * @param amountToRemove The number of levels/score points to decrease.
   */
  function removeInspectionLevels(
    address addr,
    uint256 amountToRemove
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant {
    regenerators[addr].regenerationScore.score -= amountToRemove;

    regeneratorPool.removePoolLevels(addr, amountToRemove, false);
  }

  /**
   * @dev Allows an authorized caller to decrement a regenerator's total completed inspections count.
   * This function is called when an inspection previously counted as valid is invalidated.
   * @notice Can only be called by the ValidationRules address.
   *
   * Requirements:
   * - The regenerator's `totalInspections` count must be greater than 0.
   * - If `totalInspections` becomes 0 after decrement, the regenerator is removed from `impactRegenerators`.
   * @param addr The regenerator's wallet address.
   */
  function decrementInspections(address addr) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    uint256 totalInspections = regenerators[addr].totalInspections;

    require(totalInspections > 0, "totalInspections invalid");

    if (totalInspections == 1) {
      uint256 era = poolCurrentEra();
      if (newCertificationRegenerators[era] > 0) {
        newCertificationRegenerators[era]--;
      }
      impactRegenerators[addr] = false;
    }

    if (totalInspections == MAXIMUM_INSPECTIONS) {
      totalCertifiedRegenerators--;
      certifiedRegenerators[addr] = false;
    }

    regenerators[addr].totalInspections--;
  }

  /**
   * @dev Processes actions after a regenerator requests an inspection for their area.
   * Sets the `_pendingInspection` status to `true` and records the `_lastRequestAt` timestamp.
   * @notice This function is intended to be called by a whitelisted contract, the InspectionRules.
   * @param addr The regenerator's wallet address.
   */
  function afterRequestInspection(
    address addr
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    _pendingInspection(addr, true);
    _lastRequestAt(addr, block.number);
  }

  /**
   * @notice Processes actions after an inspector accepts an inspection request from a regenerator.
   * Sets the regenerator's `_pendingInspection` status to `false`.
   * @dev This function is intended to be called by a whitelisted external contract, the InspectorRules.
   * @param addr The regenerator's wallet address.
   */
  function afterAcceptInspection(address addr) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) {
    _pendingInspection(addr, false);
  }

  /**
   * @notice Processes actions after an inspection is successfully realized for a regenerator's area.
   * Increments the regenerator's total inspections and updates their regeneration score.
   * @dev This function is intended to be called by a whitelisted external contract, the InspectionRules
   * after an inspection is completed.
   * @param addr The regenerator's wallet address.
   * @param score The score obtained from the realized inspection, to be added to the regenerator's total score.
   * @param inspectionId The id of the realized inspection.
   * @return uint256 The updated total number of inspections for the regenerator.
   */
  function afterRealizeInspection(
    address addr,
    uint32 score,
    uint64 inspectionId
  ) external mustBeAllowedCaller mustBeContractCall(inspectionRulesAddress) nonReentrant returns (uint256) {
    require(score <= MAX_SCORE, "Maximum score");
    require(!processedInspections[inspectionId], "Inspection results already submitted");

    processedInspections[inspectionId] = true;

    uint256 totalInspections;

    if (score > 0) {
      totalInspections = _incrementInspections(addr);
    } else {
      totalInspections = regenerators[addr].totalInspections;
    }

    _setRegenerationScore(addr, score, inspectionId);

    return totalInspections;
  }

  // --- Private functions ---

  /**
   * @dev Validates an array of coordinates for uniqueness and valid geographic ranges.
   * @param _coords The array of coordinate structs to validate.
   */
  function _validateCoordinates(Coordinates[] calldata _coords) private pure {
    uint256 len = _coords.length;
    int256 precision = 10 ** 6;

    for (uint256 i = 0; i < len; i++) {
      // --- 1. Convert and Validate Range ---
      int256 lat_i = _stringCoordToInt(_coords[i].latitude);
      int256 lon_i = _stringCoordToInt(_coords[i].longitude);

      require(lat_i >= -90 * precision && lat_i <= 90 * precision, "Invalid latitude");
      require(lon_i >= -180 * precision && lon_i <= 180 * precision, "Invalid longitude");

      // --- 2. Check for Duplicates ---
      for (uint256 j = i + 1; j < len; j++) {
        int256 lat_j = _stringCoordToInt(_coords[j].latitude);
        int256 lon_j = _stringCoordToInt(_coords[j].longitude);

        require(lat_i != lat_j || lon_i != lon_j, "Duplicate coordinates are not allowed");
      }
    }
  }

  /**
   * @dev Converts a coordinate string part (e.g., "-23.547319") into a scaled integer (e.g., -23547319).
   * @notice This is a utility function to handle coordinate strings. It validates characters and
   * handles positive/negative numbers with up to 6 decimal places.
   * @param coordStr The coordinate string part (latitude or longitude).
   * @return A scaled integer representation of the coordinate.
   */
  function _stringCoordToInt(string memory coordStr) private pure returns (int256) {
    bytes memory b = bytes(coordStr);
    require(b.length > 0 && b.length < 30, "Invalid coordinate string length");

    int256 result = 0;
    int256 dotPosition = -1;

    uint256 startIndex = 0;
    bool isNegative = false;
    if (b[0] == "-") {
      isNegative = true;
      startIndex = 1;
    }

    for (uint256 i = startIndex; i < b.length; i++) {
      bytes1 char = b[i];

      bool isDigit = (char >= "0" && char <= "9");
      bool isDot = (char == ".");

      require(isDigit || isDot, "Invalid character in coordinate");

      if (isDot) {
        require(dotPosition == -1, "Multiple dots in coordinate");
        dotPosition = int256(i);
      } else if (dotPosition == -1) {
        // First cast uint8 to uint256, then to int256 to ensure safe conversion.
        result = result * 10 + (int256(uint256(uint8(char))) - 48);
      }
    }

    if (dotPosition != -1) {
      uint256 decimalValue = 0;
      uint256 decimalPlaces = 0;
      for (uint256 i = uint256(dotPosition) + 1; i < b.length && decimalPlaces < 6; i++) {
        bytes1 char = b[i];
        require(char >= "0" && char <= "9", "Invalid character in decimal part");
        decimalValue = decimalValue * 10 + (uint8(char) - 48);
        decimalPlaces++;
      }

      result = result * (int256(10 ** decimalPlaces)) + int256(decimalValue);

      if (decimalPlaces < 6) {
        result = result * (int256(10 ** (6 - decimalPlaces)));
      }
    } else {
      result = result * (10 ** 6);
    }

    return isNegative ? -result : result;
  }

  /**
   * @dev Checks if a regenerator has reached the MINIMUM_INSPECTIONS_TO_POOL threshold.
   * @param totalInspections The total number of inspections completed by the regenerator.
   * @return bool `true` if the total inspections meet or exceed the minimum, `false` otherwise.
   */
  function _minimumInspections(uint256 totalInspections) private pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTIONS_TO_POOL;
  }

  /**
   * @dev Private function to update a regenerator's pending inspection status.
   * @notice Sets whether a regenerator has a pending inspection request (`true`) or not (`false`).
   * @param addr The regenerator's wallet address.
   * @param state The new pending inspection status (`true` for pending, `false` for not pending).
   */
  function _pendingInspection(address addr, bool state) private {
    regenerators[addr].pendingInspection = state;
  }

  /**
   * @dev Sets the new regeneration score for a regenerator and potentially adds levels to the pool.
   * @notice This function is called after an inspection is completed and a score is determined.
   * @param addr The regenerator's wallet address.
   * @param regenerationScore The score to add to the regenerator's total regeneration score.
   */
  function _setRegenerationScore(address addr, uint32 regenerationScore, uint64 inspectionId) private {
    Regenerator storage regenerator = regenerators[addr];
    require(regenerator.id != 0, "Regenerator does not exist");

    // Increment regenerator's total regeneration score.
    regenerator.regenerationScore.score += regenerationScore;

    // If minimum inspections are not met, only update score, not pool level.
    if (!_minimumInspections(regenerator.totalInspections)) return;

    uint256 levels = regenerationScore;

    // Logic to add initial levels if the regenerator is entering the contract pool for the first time.
    if (!regenerator.pool.onContractPool) {
      regenerator.pool.onContractPool = true;
      levels = regenerator.regenerationScore.score;
      emit RegeneratorEnteredPool(addr, block.number); // Emit event for entering pool
    }

    // Add level(s) to the regenerator pool.
    regeneratorPool.addLevel(addr, levels, inspectionId);
  }

  /**
   * @dev Private function to increment a regenerator's total completed inspections count.
   * This also updates the `impactRegenerators` flag and `newCertificationRegenerators` count.
   * @param addr The regenerator's wallet address.
   * @return uint256 The updated total number of inspections for the regenerator.
   */
  function _incrementInspections(address addr) private returns (uint256) {
    Regenerator storage regenerator = regenerators[addr];

    regenerator.totalInspections++;

    // Mark as impact regenerator.
    if (!impactRegenerators[addr]) {
      impactRegenerators[addr] = true;
      uint256 era = poolCurrentEra();
      newCertificationRegenerators[era]++;
    }

    if (regenerator.totalInspections == MAXIMUM_INSPECTIONS) {
      certifiedRegenerators[addr] = true;
      totalCertifiedRegenerators++;

      emit RegeneratorCertified(addr);
    }

    return regenerator.totalInspections;
  }

  /**
   * @dev Private function to set a regenerator's `_lastRequestAt` block.
   * @param addr The regenerator's wallet address.
   * @param blockNumber The block number at which the last request was made.
   */
  function _lastRequestAt(address addr, uint256 blockNumber) private {
    regenerators[addr].lastRequestAt = blockNumber;
  }

  /**
   * @dev Private function to decrement the global `regenerationArea` when a regenerator's
   * area is removed (due to invalidation).
   * @param addr The regenerator's wallet address whose area is to be decremented.
   *
   * Requirements:
   * - The regenerator must exist.
   * - The `totalArea` of the regenerator must be accurately reflected in `regenerationArea`.
   */
  function _decrementArea(address addr) private {
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

  /**
   * @notice Checks if new Regenerator registrations are allowed based on the dynamic count of active users.
   * @dev The number of active users is calculated as the total number of valid Regenerators
   * minus the number of those who have completed their lifecycle.
   * @return bool True if registration is allowed, false otherwise.
   */
  function isRegistrationAllowed() public view returns (bool) {
    return communityRules.userTypesCount(USER_TYPE) - totalCertifiedRegenerators < MAX_ACTIVE_REGENERATORS;
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
    uint32 totalArea,
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

  /// @dev Emitted when a regenerator completes the inspection process.
  /// @param regeneratorAddress The address of the regenerator entering the pool.
  event RegeneratorCertified(address indexed regeneratorAddress);
}
