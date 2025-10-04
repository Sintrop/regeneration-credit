// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IRegeneratorRules } from "./interfaces/IRegeneratorRules.sol";
import { IInspectorRules } from "./interfaces/IInspectorRules.sol";
import { IRegenerationIndexRules } from "./interfaces/IRegenerationIndexRules.sol";
import { IValidationRules } from "./interfaces/IValidationRules.sol";
import { IActivistRules } from "./interfaces/IActivistRules.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { InspectionStatus, Inspection, ContractsDependency, EraImpact } from "./types/InspectionTypes.sol";
import { Regenerator } from "./types/RegeneratorTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InspectionRules
 * @author Sintrop
 * @notice Manages the lifecycle of regeneration inspections, from request to realization and validation.
 * @dev This contract allows Regenerators to request inspections, and Inspectors to accept, perform, and submit them.
 * It integrates with various other rule contracts for user validation, level updates, and penalty management.
 */
contract InspectionRules is Ownable, ReentrancyGuard {
  // --- Constants ---

  /// @notice The maximum number of inspections a Regenerator can receive.
  uint8 public constant MAX_REGENERATOR_INSPECTIONS = 6;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice The maximum character length for the justification report string.
  uint16 private constant MAX_JUSTIFICATION_REPORT_LENGTH = 1000;

  /// @notice Max character length for text.
  uint16 private constant MAX_TEXT_LENGTH = 300;

  /// @notice Maximum plausible density of trees per square meter.
  uint8 private constant MAX_TREES_PER_SQM = 4;

  /// @notice The maximum result value for the biodiversity score in an inspection.
  uint32 public constant MAX_BIODIVERSITY_RESULT = 300;

  // --- State variables ---

  /// @notice Number of initial inspection requests a regenerator can make without `timeBetweenInspections` delay.
  uint8 public immutable allowedInitialRequests;

  /// @notice Time (in blocks) a regenerator must wait between inspection requests after exceeding initial allowed requests.
  uint32 public immutable timeBetweenInspections;

  /// @notice Amount of blocks an accepted inspection has before it expires if not realized.
  uint32 public immutable blocksToExpireAcceptedInspection;

  /// @notice Amount of blocks that inspectors must wait after a request is made before they can accept it.
  uint32 public immutable acceptInspectionDelayBlocks;

  /// @notice Amount of blocks for validators to analyze inspections before an era ends.
  uint32 public immutable securityBlocksToValidation;

  /// @notice Valid inspections count (inspections not invalidated).
  uint64 public inspectionsCount;

  /// @notice Total inspections count, including open, accepted, realized, and invalidated ones.
  uint64 public inspectionsTotalCount;

  /// @notice Realized inspections count (inspections that have been completed and submitted).
  uint256 public realizedInspectionsCount;

  /// @notice Sum of all valid inspections' trees impact from all past settled eras.
  uint256 public inspectionsTreesImpact;

  /// @notice Sum of all valid inspections' biodiversity impact from all past settled eras.
  uint256 public inspectionsBiodiversityImpact;

  /// @notice The total count of regenerators who are considered "impact regenerators",
  /// have reached the minimum of one inspection validated.
  uint256 public totalImpactRegenerators;

  /// @notice Tracks inspection IDs that have already been invalidated.
  mapping(uint64 => bool) public inspectionPenalized;

  /// @notice Stores inspection data by its unique ID.
  mapping(uint64 => Inspection) private inspections;

  /// Regenerator inspections ids list.
  mapping(address => uint64[]) private regeneratorInspections;

  /// @notice Checks if an inspector has already inspected a specific regenerator.
  mapping(address => mapping(address => bool)) private inspectorInspected;

  /// @notice InspectorRules contract interface for interacting with inspector-specific logic.
  IInspectorRules public inspectorRules;

  /// @notice RegeneratorRules contract interface for interacting with regenerator-specific logic.
  IRegeneratorRules public regeneratorRules;

  /// @notice CommunityRules contract interface for checking user types and other community-wide rules.
  ICommunityRules public communityRules;

  /// @notice ValidationRules contract interface for handling inspection invalidations.
  IValidationRules public validationRules;

  /// @notice ActivistRules contract interface for updating activist levels based on inspection activities.
  IActivistRules public activistRules;

  /// @notice VoteRules contract interface for checking voter eligibility.
  IVoteRules public voteRules;

  /// @notice RegenerationIndexRules contract interface for calculating regeneration scores.
  IRegenerationIndexRules public regenerationIndexRules;

  /// @notice Tracks which validator has voted on which inspection to prevent duplicate votes.
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;

  /// @notice Tracks the impact generated within each specific era.
  mapping(uint256 => EraImpact) public impactPerEra;

  /// @notice Tracks the number of the last era that impact has been set.
  uint256 public lastSettledEra;

  // --- Constructor ---

  /**
   * @notice Initializes the InspectionRules contract with key time and quantity parameters.
   * @dev Sets immutable values that govern inspection delays, expiration, and initial allowances.
   * @param timeBetweenInspections_ The number of blocks a regenerator must wait between requests.
   * @param blocksToExpireAcceptedInspection_ The number of blocks before an accepted inspection expires.
   * @param allowedInitialRequests_ The number of initial requests allowed without delay.
   * @param acceptInspectionDelayBlocks_ The number of blocks inspectors must wait before accept a new inspection.
   * @param securityBlocksToValidation_ The number of security blocks for validators before era end.
   */
  constructor(
    uint32 timeBetweenInspections_,
    uint32 blocksToExpireAcceptedInspection_,
    uint8 allowedInitialRequests_,
    uint32 acceptInspectionDelayBlocks_,
    uint32 securityBlocksToValidation_
  ) Ownable(msg.sender) {
    timeBetweenInspections = timeBetweenInspections_;
    blocksToExpireAcceptedInspection = blocksToExpireAcceptedInspection_;
    allowedInitialRequests = allowedInitialRequests_;
    acceptInspectionDelayBlocks = acceptInspectionDelayBlocks_;
    securityBlocksToValidation = securityBlocksToValidation_;
  }

  // --- Deploy functions ---

  /**
   * @notice Sets the addresses of all essential external contracts interfaces this contract depends on.
   * @dev This function can only be called once by the contract owner after deployment.
   * It initializes references to various *Rules contracts and the VoteRules contract.
   * Ownership should be renounced after this call.
   * @param contractDependency Struct containing addresses of necessary system contracts.
   */
  function setContractInterfaces(ContractsDependency memory contractDependency) external onlyOwner {
    communityRules = ICommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = IRegeneratorRules(contractDependency.regeneratorRulesAddress);
    validationRules = IValidationRules(contractDependency.validationRulesAddress);
    inspectorRules = IInspectorRules(contractDependency.inspectorRulesAddress);
    regenerationIndexRules = IRegenerationIndexRules(contractDependency.regenerationIndexRulesAddress);
    activistRules = IActivistRules(contractDependency.activistRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
  }

  // --- Public functions (State Modifying) ---

  /**
   * @dev Allows a regenerator to request a new inspection for their registered area.
   * @notice Regenerators agree to receive an inspector to assess their registered area.
   * They can make an `allowedInitialRequests` number of requests without delay.
   * After that, they must wait `timeBetweenInspections` blocks between requests.
   * A hard limit of 6 total inspections is enforced.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `REGENERATOR`.
   * - The regenerator must not have a `_pendingInspection` already open.
   * - The regenerator must adhere to the `timeBetweenInspections` delay if `allowedInitialRequests` are used up.
   * - The regenerator must have completed less than 6 total inspections.
   */
  function requestInspection() external nonReentrant {
    Regenerator memory regenerator = regeneratorRules.getRegenerator(msg.sender);

    require(communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, msg.sender), "Only regenerators");
    require(!regenerator.pendingInspection, "Request OPEN");
    require(waitToRequest(regenerator), "Wait to request");
    require(regenerator.totalInspections < MAX_REGENERATOR_INSPECTIONS, "You have completed your mission");

    // Create the new inspection record.
    _createInspection();

    // Update regenerator's state in RegeneratorRules.
    _afterRequestInspection();

    // Update era impact.
    _setEraImpact();
  }

  /**
   * @dev Allows an inspector to accept an open or expired inspection request.
   * @notice Inspectors must only accept inspections they are capable of performing, being aware
   * of the safety risks and responsibilities. By accepting an inspection, inspectors agree that the they are responsible
   * for their own safety at the data collection. It is recommended to use long sleeves clothes, hats, boots that can prevent
   * bites from animals, gloves to protect from spines and any other useful safety equipment, such as machetes or pepper spray.
   * Accepting an inspection counts as a 'give-up' until realized.
   * Inspectors can only accept one open inspection at a time and cannot inspect the same regenerator twice.
   * They must also adhere to specific delays and security windows.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `INSPECTOR`.
   * - The inspector must have less than `MAX_GIVEUPS` (from InspectorRules).
   * - The `inspectionId` must correspond to an existing inspection.
   * - The inspector must not already have an inspection `ACCEPTED` that is not yet `INSPECTED` or `INVALIDATED` or `EXPIRED`.
   * - The inspector must not have previously inspected this specific regenerator.
   * - The inspection's status must be `OPEN` or `EXPIRED`.
   * - The `acceptInspectionDelayBlocks` must have passed since the inspection was created.
   * - The system must not be within the `securityBlocksToValidation` window before an era ends.
   * - The inspector must adhere to `inspectorRules.canAcceptInspection` (delay from last realized inspection).
   * - The `inspection.regenerator` must be a valid `REGENERATOR`.
   *
   * @param inspectionId The unique ID of the inspection the inspector wishes to accept.
   */
  function acceptInspection(uint64 inspectionId) external nonReentrant {
    require(communityRules.userTypeIs(CommunityTypes.UserType.INSPECTOR, msg.sender), "Only inspectors");
    require(inspectorRules.isInspectorValid(msg.sender), "Only 3 giveUps allowed");

    Inspection storage inspection = inspections[inspectionId];

    require(inspection.id >= 1, "Inspection do not exist");
    require(alreadyHaveInspectionAccepted(), "Already accepted");
    require(!inspectorInspected[msg.sender][inspection.regenerator], "Already inspected");
    require(
      inspection.status == InspectionStatus.OPEN ||
        (inspection.status == InspectionStatus.ACCEPTED && _isInspectionExpired(inspection)),
      "Inspection must be OPEN or EXPIRED"
    );
    require(acceptInspectionDelayBlocksPassed(inspection), "Wait delay blocks");
    require(beforeAcceptHaveSecurityBlocksToVote(), "Wait until next era");
    require(inspectorRules.canAcceptInspection(msg.sender), "Wait to accept");
    require(
      communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, inspection.regenerator),
      "Regenerator invalid"
    );

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.inspector = msg.sender;

    regeneratorRules.afterAcceptInspection(inspection.regenerator);
    inspectorRules.afterAcceptInspection(msg.sender, inspectionId);

    emit InspectionAccepted(inspectionId, msg.sender, block.number);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED.
   * @notice Inspectors must evaluate the amount of trees and species of the regeneration area.
   * How many trees, palm trees and other plants over 1m high and 3cm in diameter there is in the regenerating area? Justify your answer in the report.
   * How many different species of those plants/trees were found? Each different species is equivalent to one unity and only trees and plants managed or planted by the regenerator should be counted. Justify your answer in the report.
   * Max result of 200.000 trees and 300 biodiversity.
   * Zero score means invalid inspection.
   * NOTE: If the inspector finds something suspicous about the inspected regenerator, such as invalid area, suspicious of fake account, or if the Regenerator is not
   * findable, inspectors are encourage to realize passing 0 as values with his justification at the report to avoid being penalized.
   * @param inspectionId The id of the inspection to be realized.
   * @param proofPhotos The string of a photo with the regenerator or the string of a document with the proofPhoto with the regenerator and other area photos.
   * @param justificationReport The justification and report of the result found.
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   */
  function realizeInspection(
    uint64 inspectionId,
    string memory proofPhotos,
    string memory justificationReport,
    uint32 treesResult,
    uint32 biodiversityResult
  ) external nonReentrant {
    require(bytes(proofPhotos).length <= MAX_HASH_LENGTH, "Max length");
    require(bytes(justificationReport).length <= MAX_JUSTIFICATION_REPORT_LENGTH, "Max length");

    Inspection memory inspection = inspections[inspectionId];

    require(communityRules.userTypeIs(CommunityTypes.UserType.INSPECTOR, msg.sender), "Only inspectors");
    require(inspection.status == InspectionStatus.ACCEPTED, "Accept before");
    require(inspection.inspector == msg.sender, "Not your inspection");
    require(!(block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection), "Inspection Expired");

    Regenerator memory regenerator = regeneratorRules.getRegenerator(inspection.regenerator);
    uint256 maxTreesForThisArea = uint256(regenerator.totalArea) * MAX_TREES_PER_SQM;

    require(treesResult <= maxTreesForThisArea, "Tree count exceeds density limit for this area");

    require(biodiversityResult <= MAX_BIODIVERSITY_RESULT, "Max result limit");

    _markAsRealized(inspection, proofPhotos, justificationReport, treesResult, biodiversityResult);

    _afterRealizeInspection(inspection);

    // Only count inspections that have a positive impact towards the global metrics.
    if (inspection.regenerationScore > 0) {
      uint256 era = inspection.inspectedAtEra;
      impactPerEra[era].trees += treesResult;
      impactPerEra[era].biodiversity += biodiversityResult;
      impactPerEra[era].realizedInspections++;
    }

    inspectorInspected[msg.sender][inspection.regenerator] = true;

    emit InspectionRealized(
      inspectionId,
      msg.sender,
      inspection.regenerator,
      treesResult,
      biodiversityResult,
      inspection.regenerationScore,
      block.number
    );
  }

  /**
   * @notice Allows a voter to cast a vote to invalidate an inspection.
   * This function increments the validation count for the inspection and may trigger its invalidation.
   *
   * Requirements:
   * - The `justification` string must not exceed `MAX_VALIDATION_JUSTIFICATION_LENGTH` (300) characters.
   * - The caller (`msg.sender`) must be a registered `voter` (`voteRules.canVote`).
   * - The caller must have waited the required `timeBetweenVotes` (from `validationRules.waitedTimeBetweenVotes`).
   * - The `inspectionId` must correspond to an existing and currently valid inspection.
   * - The inspection must have been realized (`INSPECTED` status).
   * - The current `poolCurrentEra() must be less than or equal to the `inspection's `inspectedAtEra` .
   *
   * @param id The unique ID of the inspection to be validated/invalidated.
   * @param justification A string explaining why the inspection is being invalidated.
   */
  function addInspectionValidation(uint64 id, string memory justification) external nonReentrant {
    // Check if user is valid.
    require(!communityRules.isDenied(msg.sender), "User denied");
    // Character limit validation for justification.
    require(bytes(justification).length <= MAX_TEXT_LENGTH, "Max characters reached");
    // Check if the caller is eligible to vote.
    require(voteRules.canVote(msg.sender), "Not a voter");
    // Check if the caller has waited the required time between votes.
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");
    // Check if the caller has already voted for this resource.
    require(!validatorInspectionsValidations[msg.sender][id], "Already voted");
    // Check if the resource has already been penalized.
    require(!inspectionPenalized[id], "Penalties already applied");

    validatorInspectionsValidations[msg.sender][id] = true;

    Inspection storage inspection = inspections[id];

    require(regeneratorRules.poolCurrentEra() == inspection.inspectedAtEra, "Can't validade anymore");
    require(inspection.id >= 1 && inspection.id <= inspectionsTotalCount, "Inspection does not exist");
    require(inspection.status == InspectionStatus.INSPECTED, "Only to inspected inspections");

    inspection.validationsCount += 1;

    uint256 _votesToInvalidate = validationRules.votesToInvalidate();
    require(_votesToInvalidate >= 2, "Validation threshold cannot be less than 2");

    if (inspection.validationsCount >= _votesToInvalidate) {
      inspectionPenalized[id] = true;

      _invalidateInspection(inspection);

      uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);

      if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) inspectorRules.denyInspector(inspection.inspector);
    }

    validationRules.updateValidatorLastVoteBlock(msg.sender);
    validationRules.addValidationPoint(msg.sender);

    emit InspectionValidation(msg.sender, inspection.id, justification);
  }

  // --- Private functions ---

  /**
   * @dev Private function that creates a new inspection request record in the system.
   * Sets its status to `OPEN`, assigns the regenerator, and increments global counters.
   */
  function _createInspection() private {
    inspectionsTotalCount++;
    uint64 id = inspectionsTotalCount;

    Inspection memory inspection = inspections[id];
    inspection.id = id;
    inspection.status = InspectionStatus.OPEN;
    inspection.regenerator = msg.sender;
    inspection.inspector = address(0);
    inspection.createdAt = block.number;
    inspections[inspection.id] = inspection;

    inspectionsCount++;

    emit InspectionRequested(id, msg.sender, block.number);
  }

  /**
   * @dev Update regenerator data after request.
   */
  function _afterRequestInspection() private {
    regeneratorRules.afterRequestInspection(msg.sender);
  }

  /**
   * @dev Update the inspection data.
   * @param inspection The current inspection.
   * @param proofPhotos The string of a photo with the regenerator or the string of a document with the proofPhoto and other area photos.
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area.
   * Only plants managed or planted by the regenerator must be counted.
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area.
   * Only plants managed or planted by the regenerator must be counted.
   * @param justificationReport The justification of the result found.
   */
  function _markAsRealized(
    Inspection memory inspection,
    string memory proofPhotos,
    string memory justificationReport,
    uint32 treesResult,
    uint32 biodiversityResult
  ) private {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.treesResult = treesResult;
    inspection.biodiversityResult = biodiversityResult;
    // Calculate regeneration score using `RegenerationIndexRules`.
    inspection.regenerationScore = regenerationIndexRules.calculateScore(treesResult, biodiversityResult);
    inspection.proofPhotos = proofPhotos;
    inspection.justificationReport = justificationReport;
    inspection.inspectedAt = block.number;
    inspection.inspectedAtEra = regeneratorRules.poolCurrentEra();
    inspections[inspection.id] = inspection;
  }

  /**
   * @dev Inscrement regenerator and inspector request actions.
   * @param inspection The inspected inspection.
   */
  function _afterRealizeInspection(Inspection memory inspection) private {
    address regeneratorAddress = inspection.regenerator;
    address inspectorAddress = inspection.inspector;

    activistRules.addRegeneratorLevel(
      regeneratorAddress,
      regeneratorRules.afterRealizeInspection(regeneratorAddress, inspection.regenerationScore, inspection.id)
    );

    activistRules.addInspectorLevel(
      inspectorAddress,
      inspectorRules.afterRealizeInspection(inspectorAddress, inspection.regenerationScore, inspection.id)
    );

    regeneratorInspections[regeneratorAddress].push(inspection.id);
  }

  /**
   * @dev Private function to execute the invalidation process for an inspection.
   * Updates global impact counters, decreases `inspectionsCount` and `realizedInspectionsCount`,
   * marks the inspection as `INVALIDATED`, and records the invalidation time.
   * It also adds penalties to the involved regenerator and inspector.
   * @param inspection A reference to the `Inspection` struct being invalidated.
   */
  function _invalidateInspection(Inspection storage inspection) private {
    // Decrement era impact metrics.
    impactPerEra[inspection.inspectedAtEra].trees -= inspection.treesResult;
    impactPerEra[inspection.inspectedAtEra].biodiversity -= inspection.biodiversityResult;
    impactPerEra[inspection.inspectedAtEra].realizedInspections--;

    inspectionsCount--; // Decrement valid inspections count

    // Update inspection status
    inspection.status = InspectionStatus.INVALIDATED;
    inspection.invalidatedAt = block.number;

    regeneratorRules.decrementInspections(inspection.regenerator);
    regeneratorRules.removeInspectionLevels(inspection.regenerator, inspection.regenerationScore);

    inspectorRules.decrementInspections(inspection.inspector);
    inspectorRules.removePoolLevels(inspection.inspector, false);

    emit InspectionInvalidated(inspection.id, inspection.inspector, inspection.regenerator, block.number);
  }

  /**
   * @dev Sets the impact of a pending era to the global counter.
   */
  function _setEraImpact() private {
    uint256 nextEraToSet = lastSettledEra + 1;

    if (nextEraToSet < regeneratorRules.poolCurrentEra()) {
      EraImpact storage eraImpact = impactPerEra[nextEraToSet];

      inspectionsTreesImpact += eraImpact.trees;
      inspectionsBiodiversityImpact += eraImpact.biodiversity;
      realizedInspectionsCount += eraImpact.realizedInspections;
      totalImpactRegenerators += regeneratorRules.newCertificationRegenerators(nextEraToSet);
      // Update the lastSetlledEra to the era just settled.
      lastSettledEra = nextEraToSet;
    }
  }

  /**
   * @dev Checks if a previously accepted inspection has expired.
   * @param inspection The inspection to check.
   * @return bool True if the inspection is expired, false otherwise.
   */
  function _isInspectionExpired(Inspection storage inspection) private view returns (bool) {
    return inspection.acceptedAt > 0 && (block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection);
  }

  // --- View functions ---

  /**
   * @dev Returns a inspection by id if that exists.
   * @param id The id of the inspection to return.
   */
  function getInspection(uint64 id) public view returns (Inspection memory) {
    return inspections[id];
  }

  /**
   * @notice Get all regenerators inspections ID's list.
   * @dev Allows to get all regenerator inspections with status INSPECTED.
   * @param addr Regenerator address to check.
   */
  function getInspectionsHistory(address addr) public view returns (uint64[] memory) {
    return regeneratorInspections[addr];
  }

  /**
   * @notice Checks if regenerator waited timeBetweenInspections.
   * @return bool True if can request.
   */
  function waitToRequest(Regenerator memory regenerator) public view returns (bool) {
    if (regenerator.totalInspections < allowedInitialRequests) return true;

    return block.number > regenerator.lastRequestAt + timeBetweenInspections;
  }

  /**
   * @notice Function to calculate amount of blocks to expire an inspection.
   * @return uint256 Return amount of blocks to expire an inspection.
   */
  function calculateBlocksToExpire(uint64 inspectionId) public view returns (uint256) {
    return inspections[inspectionId].acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  /**
   * @dev Function that checks if an inspector already have an open inspection.
   * @return bool True if can accept new inspection. False if has already an open inspection.
   */
  function alreadyHaveInspectionAccepted() public view returns (bool) {
    Inspector memory inspector = inspectorRules.getInspector(msg.sender);
    Inspection memory lastInspection = inspections[inspector.lastInspection];

    bool acceptedInspectionExpired = block.number > lastInspection.acceptedAt + blocksToExpireAcceptedInspection;

    bool finishedLastInspection = lastInspection.status == InspectionStatus.INSPECTED ||
      lastInspection.status == InspectionStatus.INVALIDATED;

    return finishedLastInspection || acceptedInspectionExpired || inspector.lastInspection == 0;
  }

  /**
   * @dev Function that checks if the inspection delay blocks has passed.
   * @return bool True if can accept, false if not.
   */
  function acceptInspectionDelayBlocksPassed(Inspection memory inspection) public view returns (bool) {
    return block.number > inspection.createdAt + acceptInspectionDelayBlocks;
  }

  /**
   * @dev Function that blocks an inspector to accept inspections at the end of an era so validators can have time for reviewing all inspections before next era.
   * @return bool True if can accept, false if not.
   */
  function beforeAcceptHaveSecurityBlocksToVote() private view returns (bool) {
    if (regeneratorRules.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return regeneratorRules.nextEraIn() - blocksToExpireAcceptedInspection > securityBlocksToValidation;
  }

  // --- Events ---

  /**
   * @notice Emitted when a new inspection request is successfully created by a Regenerator.
   * @param inspectionId The unique ID of the newly created inspection.
   * @param regeneratorAddress The address of the Regenerator who requested the inspection.
   * @param createdAt The block number when the inspection was requested.
   */
  event InspectionRequested(uint256 indexed inspectionId, address indexed regeneratorAddress, uint256 createdAt);

  /**
   * @notice Emitted when an Inspector successfully accepts an open inspection.
   * @param inspectionId The ID of the inspection that was accepted.
   * @param inspectorAddress The address of the Inspector who accepted the inspection.
   * @param acceptedAt The block number when the inspection was accepted.
   */
  event InspectionAccepted(uint256 indexed inspectionId, address indexed inspectorAddress, uint256 acceptedAt);

  /**
   * @notice Emitted when an accepted inspection is successfully realized and submitted by an Inspector.
   * @param inspectionId The ID of the inspection that was realized.
   * @param inspectorAddress The address of the Inspector who realized the inspection.
   * @param regeneratorAddress The address of the Regenerator whose area was inspected.
   * @param treesResult The reported number of trees.
   * @param biodiversityResult The reported number of species.
   * @param regenerationScore The calculated regeneration score.
   * @param inspectedAt The block number when the inspection was realized.
   */
  event InspectionRealized(
    uint256 indexed inspectionId,
    address indexed inspectorAddress,
    address indexed regeneratorAddress,
    uint32 treesResult,
    uint32 biodiversityResult,
    uint32 regenerationScore,
    uint256 inspectedAt
  );

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event InspectionValidation(address indexed _validatorAddress, uint256 indexed _resourceId, string _justification);

  /**
   * @notice Emitted when an inspection is successfully invalidated due to validator votes.
   * @param inspectionId The ID of the inspection that was invalidated.
   * @param inspectorAddress The address of the Inspector who performed the invalidated inspection.
   * @param regeneratorAddress The address of the Regenerator whose inspection was invalidated.
   * @param invalidatedAt The block number when the inspection was invalidated.
   */
  event InspectionInvalidated(
    uint256 indexed inspectionId,
    address indexed inspectorAddress,
    address indexed regeneratorAddress,
    uint256 invalidatedAt
  );
}
