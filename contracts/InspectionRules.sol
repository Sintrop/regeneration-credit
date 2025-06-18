// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { RegeneratorRules } from "./RegeneratorRules.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ValidationRules } from "./ValidationRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { InspectionStatus, Inspection, ContractsDependency } from "./types/InspectionTypes.sol";
import { Regenerator } from "./types/RegeneratorTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { VoteRules } from "./VoteRules.sol";

/**
 * @title InspectionRules
 * @author Sintrop
 * @notice Manages the lifecycle of regeneration inspections, from request to realization and validation.
 * @dev This contract allows Regenerators to request inspections, and Inspectors to accept, perform, and submit them.
 * It integrates with various other rule contracts for user validation, level updates, and penalty management.
 */
contract InspectionRules is Callable {
  // --- State Variables ---

  /// @notice Stores inspection data by its unique ID.
  mapping(uint256 => Inspection) internal inspections;

  /// User inspections ids
  mapping(address => uint256[]) internal userInspections;

  /// @notice Checks if an inspector has already inspected a specific regenerator.
  mapping(address => mapping(address => bool)) internal inspectorInspected;

  /// @notice InspectorRules contract instance for interacting with inspector-specific logic.
  InspectorRules private inspectorRules;

  /// @notice RegeneratorRules contract instance for interacting with regenerator-specific logic.
  RegeneratorRules private regeneratorRules;

  /// @notice CommunityRules contract instance for checking user types and other community-wide rules.
  CommunityRules private communityRules;

  /// @notice ValidationRules contract instance for handling inspection invalidations.
  ValidationRules private validationRules;

  /// @notice ActivistRules contract instance for updating activist levels based on inspection activities.
  ActivistRules private activistRules;

  /// @notice VoteRules contract instance for checking voter eligibility.
  VoteRules internal voteRules;

  /// @notice RegenerationIndexRules contract instance for calculating regeneration scores.
  RegenerationIndexRules private regenerationIndexRules;

  /// @notice Valid inspections count (inspections not invalidated).
  uint256 public inspectionsCount;

  /// @notice Realized inspections count (inspections that have been completed and submitted).
  uint256 public realizedInspectionsCount;

  /// @notice Total inspections count, including open, accepted, realized, and invalidated ones.
  uint256 public inspectionsTotalCount;

  /// @notice Sum of all valid inspections' trees impact.
  uint256 public inspectionsTreesImpact;

  /// @notice Sum of all valid inspections' biodiversity impact.
  uint256 public inspectionsBiodiversityImpact;

  /// @notice Time (in blocks) a regenerator must wait between inspection requests after exceeding initial allowed requests.
  uint32 public immutable timeBetweenInspections;

  /// @notice Amount of blocks an accepted inspection has before it expires if not realized.
  uint32 public immutable blocksToExpireAcceptedInspection;

  /// @notice Number of initial inspection requests a regenerator can make without `timeBetweenInspections` delay.
  uint8 public immutable allowedInitialRequests;

  /// @notice Amount of blocks that inspectors must wait after a request is made before they can accept it.
  uint32 public immutable acceptInspectionDelayBlocks;

  /// @notice Amount of blocks for validators to analyze inspections before an era ends.
  uint32 public immutable securityBlocksToValidatorAnalysis;

  // --- Constructor ---

  /**
   * @notice Initializes the InspectionRules contract with key time and quantity parameters.
   * @dev Sets immutable values that govern inspection delays, expiration, and initial allowances.
   * @param timeBetweenInspections_ The number of blocks a regenerator must wait between requests.
   * @param blocksToExpireAcceptedInspection_ The number of blocks before an accepted inspection expires.
   * @param allowedInitialRequests_ The number of initial requests allowed without delay.
   * @param acceptInspectionDelayBlocks_ The number of blocks inspectors must wait before accepting.
   * @param securityBlocksToValidatorAnalysis_ The number of security blocks for validators before era end.
   */
  constructor(
    uint32 timeBetweenInspections_,
    uint32 blocksToExpireAcceptedInspection_,
    uint8 allowedInitialRequests_,
    uint32 acceptInspectionDelayBlocks_,
    uint32 securityBlocksToValidatorAnalysis_
  ) {
    timeBetweenInspections = timeBetweenInspections_;
    blocksToExpireAcceptedInspection = blocksToExpireAcceptedInspection_;
    allowedInitialRequests = allowedInitialRequests_;
    acceptInspectionDelayBlocks = acceptInspectionDelayBlocks_;
    securityBlocksToValidatorAnalysis = securityBlocksToValidatorAnalysis_;
  }

  // --- Owner function (Setup Only) ---

  /**
   * @notice Sets the addresses of all essential external contracts this contract depends on.
   * @dev This function can only be called once by the contract owner after deployment.
   * It initializes references to various *Rules contracts and the VoteRules contract.
   * Ownership should be renounced after this call.
   * @param contractDependency Struct containing addresses of all system contracts.
   */
  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    regenerationIndexRules = RegenerationIndexRules(contractDependency.regenerationIndexRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  // --- External Functions (State Modifying) ---

  /**
   * @dev Allows a regenerator to request a new inspection for their registered area.
   * @notice Regenerators agree to receive an inspector to assess their registered area.
   * They can make an `allowedInitialRequests` number of requests without delay.
   * After that, they must wait `timeBetweenInspections` blocks between requests.
   * A hard limit of 12 total inspections is enforced.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `REGENERATOR`.
   * - The regenerator must not have a `pendingInspection` already open.
   * - The regenerator must adhere to the `timeBetweenInspections` delay if `allowedInitialRequests` are used up.
   * - The regenerator must have completed less than 12 total inspections.
   */
  function requestInspection() public {
    Regenerator memory regenerator = regeneratorRules.getRegenerator(msg.sender);

    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Only regenerators");
    require(!regenerator.pendingInspection, "Request already OPEN");
    require(waitToRequest(regenerator), "Wait to request");
    require(regenerator.totalInspections < 12, "You have completed your mission");

    // Create the new inspection record.
    createInspection();

    // Update regenerator's state in RegeneratorRules.
    afterRequestInspection();
  }

  /**
   * @dev Allows an inspector to accept an open inspection request.
   * @notice Inspectors must only accept inspections they are capable of performing, being aware
   * of the safety risks and responsibilities. Accepting an inspection counts as a 'give-up' until realized.
   * Inspectors can only accept one open inspection at a time and cannot inspect the same regenerator twice.
   * They must also adhere to specific delays and security windows.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered `INSPECTOR`.
   * - The inspector must have less than `MAX_GIVEUPS` (from InspectorRules).
   * - The `inspectionId` must correspond to an existing inspection.
   * - The inspector must not already have an inspection `ACCEPTED` that is not yet `INSPECTED` or `INVALIDATED` or `EXPIRED`.
   * - The inspector must not have previously inspected this specific regenerator.
   * - The inspection's status must be `OPEN`.
   * - The `acceptInspectionDelayBlocks` must have passed since the inspection was created.
   * - The system must not be within the `securityBlocksToValidatorAnalysis` window before an era ends.
   * - The inspector must adhere to `inspectorRules.canAcceptInspection` (delay from last realized inspection).
   * - The `inspection.regenerator` must be a valid `REGENERATOR`.
   *
   * @param inspectionId The unique ID of the inspection the inspector wishes to accept.
   */
  function acceptInspection(uint256 inspectionId) public {
    require(communityRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Only inspectors");
    require(inspectorRules.isInspectorValid(msg.sender), "No more than 3 giveUps allowed");

    Inspection storage inspection = inspections[inspectionId];

    require(inspection.id >= 1, "Inspection do not exist");
    require(canAcceptNewInspection(), "You already have an inspection Accepted");
    require(!inspectorInspected[msg.sender][inspection.regenerator], "Already inspected this regenerator");
    require(inspection.status == InspectionStatus.OPEN, "Inspection must be OPEN");
    require(acceptInspectionDelayBlocksPassed(inspection), "Wait inspection delay blocks");
    require(beforeAcceptHaveSecurityBlocksToVote(), "Wait until next era to accept");
    require(inspectorRules.canAcceptInspection(msg.sender), "Wait to accept");
    require(communityRules.userTypeIs(UserType.REGENERATOR, inspection.regenerator), "Regenerator invalid");

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
   * @param inspectionId The id of the inspection to be realized.
   * @param proofPhotos The string of a photo with the regenerator or the string of a document with the proofPhoto with the regenerator and other area photos.
   * @param justificationReport The justification and report of the result found.
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   */
  function realizeInspection(
    uint256 inspectionId,
    string memory proofPhotos,
    string memory justificationReport,
    uint256 treesResult,
    uint256 biodiversityResult
  ) public {
    require(bytes(proofPhotos).length <= 100, "Max proofPhotos length");
    require(bytes(justificationReport).length <= 1000, "Max report length");

    Inspection memory inspection = inspections[inspectionId];

    require(communityRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Only inspectors");
    require(inspection.status == InspectionStatus.ACCEPTED, "Accept this inspection before");
    require(inspection.inspector == msg.sender, "Not your inspection");
    require(!(block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection), "Inspection Expired");
    require(treesResult <= 200000 && biodiversityResult <= 300, "Max result limit");

    markAsRealized(inspection, proofPhotos, justificationReport, treesResult, biodiversityResult);

    afterRealizeInspection(inspection);

    inspectionsTreesImpact += treesResult;
    inspectionsBiodiversityImpact += biodiversityResult;
    inspectorInspected[msg.sender][inspection.regenerator] = true;
    realizedInspectionsCount++;

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
  function addInspectionValidation(uint256 id, string memory justification) public {
    require(bytes(justification).length <= 300, "Max 300 characters reached");
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    Inspection storage inspection = inspections[id];

    require(regeneratorRules.poolCurrentEra() <= inspection.inspectedAtEra, "Can't validade anymore");
    require(inspection.id >= 1 && inspection.id <= inspectionsTotalCount, "Inspection does not exist");
    require(inspection.status == InspectionStatus.INSPECTED, "Only INSPECTED inspections can be validated");

    inspection.validationsCount += 1;

    bool mustInvalidateInspection = inspection.validationsCount >= validationRules.votesToInvalidate();

    if (mustInvalidateInspection) invalidateInspection(inspection);

    validationRules.addInspectionValidation(inspection, justification, msg.sender);
  }

  // --- Internal functions ---

  /**
   * @dev Internal function that creates a new inspection request record in the system.
   * Sets its status to `OPEN`, assigns the regenerator, and increments global counters.
   */
  function createInspection() internal {
    inspectionsTotalCount++;
    uint256 id = inspectionsTotalCount;

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
  function afterRequestInspection() internal {
    regeneratorRules.afterRequestInspection(msg.sender);
  }

  /**
   * @dev Update the inspection data
   * @param inspection The current inspection
   * @param proofPhotos The string of a photo with the regenerator or the string of a document with the proofPhoto with the regenerator and other area photos.
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param justificationReport The justification of the result found
   */
  function markAsRealized(
    Inspection memory inspection,
    string memory proofPhotos,
    string memory justificationReport,
    uint256 treesResult,
    uint256 biodiversityResult
  ) internal {
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
  function afterRealizeInspection(Inspection memory inspection) internal {
    address regeneratorAddress = inspection.regenerator;
    address inspectorAddress = inspection.inspector;

    activistRules.addRegeneratorLevel(
      regeneratorAddress,
      regeneratorRules.afterRealizeInspection(regeneratorAddress, inspection.regenerationScore)
    );

    activistRules.addInspectorLevel(inspectorAddress, inspectorRules.afterRealizeInspection(inspectorAddress));

    userInspections[regeneratorAddress].push(inspection.id);
  }

  /**
   * @dev Internal function to execute the invalidation process for an inspection.
   * Updates global impact counters, decreases `inspectionsCount` and `realizedInspectionsCount`,
   * marks the inspection as `INVALIDATED`, and records the invalidation time.
   * It also adds penalties to the involved regenerator and inspector.
   * @param inspection A reference to the `Inspection` struct being invalidated.
   */
  function invalidateInspection(Inspection storage inspection) internal {
    // Decrement global impact metrics.
    inspectionsTreesImpact -= inspection.treesResult;
    inspectionsBiodiversityImpact -= inspection.biodiversityResult;

    inspectionsCount--; // Decrement valid inspections count
    realizedInspectionsCount--; // Decrement realized inspections count

    // Update inspection status
    inspection.status = InspectionStatus.INVALIDATED;
    inspection.invalidatedAt = block.number;

    emit InspectionInvalidated(inspection.id, inspection.inspector, inspection.regenerator, block.number);
  }

  // --- View functions ---

  /**
   * @dev Returns a inspection by id if that exists.
   * @param id The id of the inspection to return.
   */
  function getInspection(uint256 id) public view returns (Inspection memory) {
    require(id >= 1 && id <= inspectionsTotalCount, "Inspection do not exist");
    return inspections[id];
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
  function calculateBlocksToExpire(uint256 inspectionId) public view returns (uint256) {
    return inspections[inspectionId].acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  /**
   * @dev Function that checks if an inspector already have an open inspection.
   * @return bool True if can accept new inspection. False if has already an open inspection.
   */
  function canAcceptNewInspection() private view returns (bool) {
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
  function acceptInspectionDelayBlocksPassed(Inspection memory inspection) private view returns (bool) {
    if (inspection.createdAt == 0) return false;

    return block.number > inspection.createdAt + acceptInspectionDelayBlocks;
  }

  /**
   * @dev Function that blocks an inspector to accept inspections at the end of an era so validators can have time for reviewing all inspections before next era.
   * @return bool True if can accept, false if not.
   */
  function beforeAcceptHaveSecurityBlocksToVote() private view returns (bool) {
    if (regeneratorRules.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return regeneratorRules.nextEraIn() - blocksToExpireAcceptedInspection > securityBlocksToValidatorAnalysis;
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
    uint256 treesResult,
    uint256 biodiversityResult,
    uint256 regenerationScore,
    uint256 inspectedAt
  );

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
