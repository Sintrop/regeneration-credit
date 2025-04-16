// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegeneratorRules } from "./RegeneratorRules.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ValidatorRules } from "./ValidatorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { InspectionStatus, Inspection } from "./types/InspectionTypes.sol";
import { Regenerator } from "./types/RegeneratorTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ContractsDependency } from "./types/SintropTypes.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @author Sintrop
 * @title InspectionRules
 * @dev Manage inspections rules and data
 * @notice Allow regenerator to request inspection, and inspectors to accept and realize it
 */
contract InspectionRules is Callable {
  using SafeMath for uint256;

  /// @notice Checks if an inspector has already inspected a regenerator
  mapping(address => mapping(address => bool)) internal inspectorInspected;

  mapping(address => uint256[]) internal userInspections;

  /// @notice The relationship between id and inspection data
  mapping(uint256 => Inspection) internal inspections;
  mapping(address => mapping(uint256 => bool)) internal validatorValidations;

  InspectorRules private inspectorRules;
  RegeneratorRules private regeneratorRules;

  /// @notice CommunityRules contract address
  CommunityRules private communityRules;

  /// @notice ValidatorRules contract address
  ValidatorRules private validatorRules;

  /// @notice ActivistRules contract address
  ActivistRules private activistRules;

  /// @notice RegenerationIndexRules contract address
  RegenerationIndexRules private regenerationIndexRules;

  uint256 public inspectionsCount;
  uint256 public inspectionsTotalCount;
  uint256 public inspectionsTreesImpact;
  uint256 public inspectionsBiodiversityImpact;
  uint256 public immutable timeBetweenInspections;
  uint256 public immutable blocksToExpireAcceptedInspection;
  uint256 public immutable allowedInitialRequests;
  uint256 public immutable acceptInspectionDelayBlocks;
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
    validatorRules = ValidatorRules(contractDependency.validatorRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    regenerationIndexRules = RegenerationIndexRules(contractDependency.regenerationIndexRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
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
    Inspection memory inspection;

    inspection.id = inspectionsTotalCount + 1;
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
   * @param treesResult The number of trees, palm trees and other plants larger than 5cm in diamater found in the regeneration area. Only plants managed or planted by the regenerator must be counted
   * @param biodiversityResult The number of different species of trees, palm trees and other plants larger than 5 cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted
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
  }

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
    inspection.inspectedAtEra = regeneratorRules.regeneratorPoolEra();

    inspections[inspection.id] = inspection;
  }

  /**
   * @dev Inscrement regenerator and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address regeneratorAddress = inspection.regenerator;
    address inspectorAddress = inspection.inspector;

    activistRules.addLevel(
      regeneratorAddress,
      regeneratorRules.afterRealizeInspection(regeneratorAddress, inspection.regenerationScore),
      inspectorAddress,
      inspectorRules.afterRealizeInspection(inspectorAddress)
    );

    userInspections[regeneratorAddress].push(inspection.id);
    userInspections[inspectorAddress].push(inspection.id);
  }

  function addInspectionValidation(uint256 id, string memory justification) public {
    require(communityRules.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Inspection memory inspection = inspections[id];

    require(inspection.inspectedAtEra == regeneratorRules.regeneratorPoolEra(), "Can not add validation anymore");

    inspection.validationsCount += 1;
    inspections[inspection.id] = inspection;

    bool mustInvalidateInspection = inspection.validationsCount >= validatorRules.majorityValidatorsCount();

    if (mustInvalidateInspection) invalidateInspection(inspection);

    validatorRules.addInspectionValidation(inspection, justification, msg.sender);
  }

  function invalidateInspection(Inspection memory inspection) internal {
    inspectionsTreesImpact -= inspection.treesResult;
    inspectionsBiodiversityImpact -= inspection.biodiversityResult;
    inspectionsCount--;
    inspection.status = InspectionStatus.INVALIDATED;
    inspection.invalidatedAt = block.number;
    inspections[inspection.id] = inspection;
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

  function alreadyHaveInspectionAccepted() private view returns (bool) {
    Inspector memory inspector = inspectorRules.getInspector(msg.sender);
    Inspection memory lastInspection = inspections[inspector.lastInspection];

    bool acceptedInspectionExpired = block.number > lastInspection.acceptedAt + blocksToExpireAcceptedInspection;

    bool finishedLastInspection = lastInspection.status == InspectionStatus.INSPECTED ||
      lastInspection.status == InspectionStatus.INVALIDATED;

    return finishedLastInspection || acceptedInspectionExpired || inspector.lastInspection == 0;
  }

  function acceptInspectionDelayBlocksPassed(Inspection memory inspection) private view returns (bool) {
    return block.number > inspection.createdAt + acceptInspectionDelayBlocks;
  }

  function beforeAcceptHaveSecurityBlocksToVote() private view returns (bool) {
    if (regeneratorRules.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return regeneratorRules.nextEraIn().sub(blocksToExpireAcceptedInspection) > securityBlocksToValidatorAnalysis;
  }
}
