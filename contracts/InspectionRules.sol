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
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
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
  using SafeMath for uint256;

  // --- State Variables ---  

  /// @notice Stores inspection data by its unique ID.
  mapping(uint256 => Inspection) internal inspections;

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
  uint256 public immutable timeBetweenInspections;

  /// @notice Amount of blocks an accepted inspection has before it expires if not realized.
  uint256 public immutable blocksToExpireAcceptedInspection;

  /// @notice Number of initial inspection requests a regenerator can make without `timeBetweenInspections` delay.
  uint256 public immutable allowedInitialRequests;

  /// @notice Amount of blocks that inspectors must wait after a request is made before they can accept it.
  uint256 public immutable acceptInspectionDelayBlocks;

  /// @notice Amount of blocks for validators to analyze inspections before an era ends.
  uint256 public immutable securityBlocksToValidatorAnalysis;

  /// @notice Flag to ensure contract dependencies are set only once.
  bool public contractsDependenciesSet;

  // --- Events ---

  /**
   * @notice Emitted when a new inspection request is successfully created by a Regenerator.
   * @param inspectionId The unique ID of the newly created inspection.
   * @param regeneratorAddress The address of the Regenerator who requested the inspection.
   * @param createdAt The block number when the inspection was requested.
   */
  event InspectionRequested(
    uint256 indexed inspectionId,
    address indexed regeneratorAddress,
    uint256 createdAt
  );

  /**
   * @notice Emitted when an Inspector successfully accepts an open inspection.
   * @param inspectionId The ID of the inspection that was accepted.
   * @param inspectorAddress The address of the Inspector who accepted the inspection.
   * @param acceptedAt The block number when the inspection was accepted.
   */
  event InspectionAccepted(
    uint256 indexed inspectionId,
    address indexed inspectorAddress,
    uint256 acceptedAt
  );

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
    uint256 timeBetweenInspections_,
    uint256 blocksToExpireAcceptedInspection_,
    uint256 allowedInitialRequests_,
    uint256 acceptInspectionDelayBlocks_,
    uint256 securityBlocksToValidatorAnalysis_
  ) {
    timeBetweenInspections = timeBetweenInspections_;
    blocksToExpireAcceptedInspection = blocksToExpireAcceptedInspection_;
    allowedInitialRequests = allowedInitialRequests_;
    acceptInspectionDelayBlocks = acceptInspectionDelayBlocks_;
    securityBlocksToValidatorAnalysis = securityBlocksToValidatorAnalysis_;
    contractsDependenciesSet = false; // Initialize the flag    
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
    require(!contractsDependenciesSet, "Dependencies already set"); // Enforce one-time call

    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    regenerationIndexRules = RegenerationIndexRules(contractDependency.regenerationIndexRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);

    contractsDependenciesSet = true; // Mark as set
  }

  // --- External Functions (State Modifying) ---

  /**
   * @dev Allows regenerators to request an inspection.
   * @notice When requesting an inspection, the regenerator agrees to receive an inspector to assess the registered area.
   */
  function requestInspection() public {
    Regenerator memory regenerator = regeneratorRules.getRegenerator(msg.sender);

    require(communityRules.userTypeIs(UserType.REGENERATOR, msg.sender), "Please register as regenerator");
    require(!regenerator.pendingInspection, "Request already OPEN");
    require(waitToRequest(regenerator), "Wait to request");
    require(regenerator.totalInspections < 12, "You have completed your mission");

    createInspection();

    afterRequestInspection();
  }

  /**
   * @dev Function that creates a new inspection
   */
  function createInspection() internal {
    uint256 id = inspectionsTotalCount + 1;
    Inspection memory inspection = inspections[id];

    inspection.id = id;
    inspection.status = InspectionStatus.OPEN;
    inspection.regenerator = msg.sender;
    inspection.inspector = address(0);
    inspection.createdAt = block.number;
    inspections[inspection.id] = inspection;
    inspectionsCount++;
    inspectionsTotalCount++;

    emit InspectionRequested(id, msg.sender, block.number);
  }

  function afterRequestInspection() internal {
    regeneratorRules.afterRequestInspection(msg.sender);
  }

  /**
   * @dev Allows the current user (inspector) accept a inspection.
   * @notice Inspectors must only accept inspections that they can perform. 
   * You will need to estimate how many trees over 1m high and 3 cm in diamater there is in the regenerator area.
   * Your safety is your responsability! Visiting regeneration areas presents natural ecosystem threats, such as dangerous animals (snakes, tigers, ...), falling branches, etc. 
   * Be prepared and use appropriate safety equipments, such as boots, hat, long sleeves clothing, machetes, knifes, etc.
   * Study the area before accepting. If you accept an inspection, you gain 1 giveUp. You lose this giveUp if you realize the inspection. But with 3 giveUps you account get locked.
   * By accepting this function, you agree that your safety is your responsibility.
   * @param inspectionId The id of the inspection that the inspector want accept.
   */   
  function acceptInspection(uint256 inspectionId) public {
    require(communityRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectorRules.isInspectorValid(msg.sender), "No more than 3 giveUps allowed");

    Inspection memory inspection = inspections[inspectionId];

    require(inspection.id >= 1, "This inspection do not exist");
    require(alreadyHaveInspectionAccepted(), "You already have an inspection Accepted");
    require(!inspectorInspected[msg.sender][inspection.regenerator], "Already inspected this regenerator");
    require(inspection.status == InspectionStatus.OPEN, "This inspection is not OPEN");
    require(acceptInspectionDelayBlocksPassed(inspection), "Wait inspection delay blocks");
    require(beforeAcceptHaveSecurityBlocksToVote(), "Wait until next era to accept");
    require(inspectorRules.canAcceptInspection(msg.sender), "Wait to accept");
    require(communityRules.userTypeIs(UserType.REGENERATOR, inspection.regenerator), "Regenerator invalid");

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.inspector = msg.sender;
    inspections[inspectionId] = inspection;

    regeneratorRules.afterAcceptInspection(inspection.regenerator);
    inspectorRules.afterAcceptInspection(msg.sender, inspectionId);

    emit InspectionAccepted(inspectionId, msg.sender, block.number);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED.
   * @notice Inspectors must evaluate the amount of trees and species of the regeneration area.
   * How many trees, palm trees and other plants over 1m high and 3cm in diameter there is in the regenerating area? Justify your answer in the report.
   * How many different species of those plants/trees were found? Each different species is equivalent to one unity and only trees and plants managed or planted by the regenerator should be counted. Justify your answer in the report.
   * @param inspectionId The id of the inspection to be realized.
   * @param proofPhoto The string of a photo with the regenerator or at the regeneration area.
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted.
   * @param report The justification of the result found.
   */
  function realizeInspection(
    uint256 inspectionId,
    string memory proofPhoto,
    string memory report,
    uint256 treesResult,
    uint256 biodiversityResult
  ) public {
    Inspection memory inspection = inspections[inspectionId];

    require(communityRules.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspection.status == InspectionStatus.ACCEPTED, "Accept this inspection before");
    require(inspection.inspector == msg.sender, "You have not accepted this inspection");
    require(!(block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection), "Inspection Expired");
    require(treesResult <= 200000 && biodiversityResult <= 300, "Max result limit");

    markAsRealized(inspection, proofPhoto, report, treesResult, biodiversityResult);

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
   * @dev Update the inspection data
   * @param inspection The current inspection
   * @param proofPhoto The string of a photo with the regenerator or at the regeneration area
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param biodiversityResult The number of different species of trees, palm trees and other plants lover 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param report The justification of the result found
   */
  function markAsRealized(
    Inspection memory inspection,
    string memory proofPhoto,
    string memory report,
    uint256 treesResult,
    uint256 biodiversityResult
  ) internal {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.treesResult = treesResult;
    inspection.biodiversityResult = biodiversityResult;
    inspection.regenerationScore = regenerationIndexRules.calculateScore(treesResult, biodiversityResult);
    inspection.proofPhoto = proofPhoto;
    inspection.report = report;
    inspection.inspectedAt = block.number;
    inspection.inspectedAtEra = regeneratorRules.poolCurrentEra();

    inspections[inspection.id] = inspection;
  }

  /**
   * @dev Inscrement regenerator and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address regeneratorAddress = inspection.regenerator;
    address inspectorAddress = inspection.inspector;

    activistRules.addRegeneratorLevel(
      regeneratorAddress,
      regeneratorRules.afterRealizeInspection(regeneratorAddress, inspection.regenerationScore)
    );

    activistRules.addInspectorLevel(inspectorAddress, inspectorRules.afterRealizeInspection(inspectorAddress));
  }

  /**
   * @notice Allows a voter to attempt to vote to invalidate an inspection
   *
   * Requirements:
   *
   * - the caller must be a voter user
   * - caller level must be above average
   * - caller must have waited timeBetweenVotes
   *
   * @param id Resource id
   * @param justification Invalidation justification
   */
  function addInspectionValidation(uint256 id, string memory justification) public {
    require(bytes(justification).length <= 300, "Max 300 characters reached");
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    Inspection memory inspection = inspections[id];

    require(regeneratorRules.poolCurrentEra() <= inspection.inspectedAtEra, "Can not add validation anymore");

    inspection.validationsCount += 1;
    inspections[inspection.id] = inspection;

    bool mustInvalidateInspection = inspection.validationsCount >= validationRules.votesToInvalidate();

    if (mustInvalidateInspection) invalidateInspection(inspection);

    validationRules.addInspectionValidation(inspection, justification, msg.sender);
  }

  /**
   * @dev Function to invalidate an inspection
   * @param inspection The invalidated inspection
   */
  function invalidateInspection(Inspection memory inspection) internal {
    inspectionsTreesImpact -= inspection.treesResult;
    inspectionsBiodiversityImpact -= inspection.biodiversityResult;
    inspectionsCount--;
    inspection.status = InspectionStatus.INVALIDATED;
    inspection.invalidatedAt = block.number;
    inspections[inspection.id] = inspection;
    realizedInspectionsCount--;

    emit InspectionInvalidated(
        inspection.id,
        inspection.inspector,
        inspection.regenerator,
        block.number
    );    
  }

  /**
   * @dev Returns a inspection by id if that exists.
   * @param id The id of the inspection to return.
   */
  function getInspection(uint256 id) public view returns (Inspection memory) {
    require(id >= 1 && id <= inspectionsTotalCount, "This inspection do not exist");
    return inspections[id];
  }

  /**
   * @notice Checks if regenerator waited timeBetweenInspections
   * @return bool True if can request
   */
  function waitToRequest(Regenerator memory regenerator) public view returns (bool) {
    if (regenerator.totalInspections < allowedInitialRequests) return true;

    return block.number > regenerator.lastRequestAt + timeBetweenInspections;
  }

  /**
   * @notice Function to calculate amount of blocks to expire an inspection
   * @return uint256 Return amount of blocks to expire an inspection
   */
  function calculateBlocksToExpire(uint256 inspectionId) public view returns (uint256) {
    return inspections[inspectionId].acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  /**
   * @dev Function that checks if an inspector already have an open inspection
   * @return bool inspection The invalidated inspection
   */
  function alreadyHaveInspectionAccepted() private view returns (bool) {
    Inspector memory inspector = inspectorRules.getInspector(msg.sender);
    Inspection memory lastInspection = inspections[inspector.lastInspection];

    bool acceptedInspectionExpired = block.number > lastInspection.acceptedAt + blocksToExpireAcceptedInspection;

    bool finishedLastInspection = lastInspection.status == InspectionStatus.INSPECTED ||
      lastInspection.status == InspectionStatus.INVALIDATED;

    return finishedLastInspection || acceptedInspectionExpired || inspector.lastInspection == 0;
  }

  /**
   * @dev Function that checks if the inspection delay blocks has passed
   * @return bool True if can accept, false if not
   */
  function acceptInspectionDelayBlocksPassed(Inspection memory inspection) private view returns (bool) {
    return block.number > inspection.createdAt + acceptInspectionDelayBlocks;
  }

  /**
   * @dev Function that blocks an inspector to accept inspections at the end of an era so validators can have time for reviewing all inspections before next era
   * @return bool True if can accept, false if not
   */
  function beforeAcceptHaveSecurityBlocksToVote() private view returns (bool) {
    if (regeneratorRules.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return regeneratorRules.nextEraIn().sub(blocksToExpireAcceptedInspection) > securityBlocksToValidatorAnalysis;
  }
}
