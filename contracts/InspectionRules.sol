// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegeneratorRules } from "./RegeneratorRules.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ValidationRules } from "./ValidationRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
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
 * @author Sintrop
 * @title InspectionRules
 * @dev Manage inspections rules and data
 * @notice Allow regenerator to request inspection, and inspectors to accept and realize it
 */
contract InspectionRules is Callable {
  using SafeMath for uint256;

  /// Checks if an inspector has already inspected a regenerator
  mapping(address => mapping(address => bool)) internal inspectorInspected;

  /// User inspections ids
  mapping(address => uint256[]) internal userInspections;

  /// The relationship between id and inspection data
  mapping(uint256 => Inspection) internal inspections;

  /// InspectorRules contract address
  InspectorRules private inspectorRules;

  /// RegeneratorRules contract address
  RegeneratorRules private regeneratorRules;

  /// CommunityRules contract address
  CommunityRules private communityRules;

  /// ValidationRules contract address
  ValidationRules private validationRules;

  /// ActivistRules contract address
  ActivistRules private activistRules;

  /// ValidationRules contract address
  VoteRules internal voteRules;

  /// RegenerationIndexRules contract address
  RegenerationIndexRules private regenerationIndexRules;

  /// @notice Valid inspections count
  uint256 public inspectionsCount;

  /// @notice Realized inspections count
  uint256 public realizedInspectionsCount;

  /// @notice Total inspections count, including invalidated ones
  uint256 public inspectionsTotalCount;

  /// @notice Sum of all inspections trees impact
  uint256 public inspectionsTreesImpact;

  /// @notice Sum of all inspections biodiversity impact
  uint256 public inspectionsBiodiversityImpact;

  /// @notice Time between inspections after reaching the allowedInitialRequests
  uint256 public immutable timeBetweenInspections;

  /// @notice Amount of blocks to expire an accepted inspection
  uint256 public immutable blocksToExpireAcceptedInspection;

  /// @notice Allowed initial inspections to be approved and before reaching the timeBetweenInspections
  uint256 public immutable allowedInitialRequests;

  /// @notice Amount of blocks that inspectors must wait to accept a new requested inspection
  uint256 public immutable acceptInspectionDelayBlocks;

  /// @notice Amount of blocks for validators to check inspections before ending an era
  uint256 public immutable securityBlocksToValidatorAnalysis;

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
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    regenerationIndexRules = RegenerationIndexRules(contractDependency.regenerationIndexRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev Allows to get all regenerator/inspector inspections with status INSPECTED
   */
  function getInspectionsHistory(address addr) public view returns (uint256[] memory) {
    return userInspections[addr];
  }

  /**
   * @dev Allows the current user (regenerator) request a inspection
   * @notice When requesting an inspection, the regenerator agrees to receive an inspector to assess the area under regeneration
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
  }

  function afterRequestInspection() internal {
    regeneratorRules.afterRequestInspection(msg.sender);
  }

  /**
   * @dev Allows the current user (inspector) accept a inspection.
   * @notice Inspectors must only accept inspections that they can perform
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

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.inspector = msg.sender;
    inspections[inspectionId] = inspection;

    regeneratorRules.afterAcceptInspection(inspection.regenerator);
    inspectorRules.afterAcceptInspection(msg.sender, inspectionId);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED
   * @notice Inspectors must evaluate the amount of trees and species of the regeneration area
   * @param inspectionId The id of the inspection to be realized
   * @param proofPhoto The string of a photo with the regenerator or at the regeneration area
   * @param treesResult The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param biodiversityResult The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param report The justification of the result found
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

    markAsRealized(inspection, proofPhoto, report, treesResult, biodiversityResult);

    afterRealizeInspection(inspection);

    inspectionsTreesImpact += treesResult;
    inspectionsBiodiversityImpact += biodiversityResult;
    inspectorInspected[msg.sender][inspection.regenerator] = true;
    realizedInspectionsCount++;
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

    userInspections[regeneratorAddress].push(inspection.id);
    userInspections[inspectorAddress].push(inspection.id);
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
  }

  /**
   * @dev Returns a inspection by id if that exists.
   * @param id The id of the inspection to return.
   */
  function getInspection(uint256 id) public view returns (Inspection memory) {
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
