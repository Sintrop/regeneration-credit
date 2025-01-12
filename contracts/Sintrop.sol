// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegeneratorRules } from "./RegeneratorRules.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ValidatorRules } from "./ValidatorRules.sol";
import { RegenerationIndexRules } from "./RegenerationIndexRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { UserRules } from "./UserRules.sol";
import { InspectionStatus, RegenerationInspection, Inspection } from "./types/InspectionData.sol";
import { Regenerator } from "./types/RegeneratorData.sol";
import { Inspector } from "./types/InspectorData.sol";
import { UserType } from "./types/UserData.sol";
import { ContractsDependency } from "./types/SintropData.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { CallerRules } from "./CallerRules.sol";

/**
 * @author Sintrop
 * @title SintropContract
 * @dev Manage inspections rules and data
 * @notice Allow regenerator to request inspection, and inspectors to accept and realize it
 */
contract Sintrop is CallerRules {
  using SafeMath for uint256;

  mapping(address => mapping(address => bool)) internal inspectorInspected;
  mapping(address => uint256[]) internal userInspections;
  mapping(uint256 => Inspection) internal inspections;
  mapping(uint256 => RegenerationInspection[]) public regenerationInspection;
  mapping(address => mapping(uint256 => bool)) internal validatorValidations;

  InspectorRules private inspectorContract;
  RegeneratorRules private regeneratorContract;
  UserRules private userContract;
  ValidatorRules private validatorContract;
  ActivistRules private activistContract;
  RegenerationIndexRules private categoryContract;

  uint256 public inspectionsCount;
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
    userContract = UserRules(contractDependency.userContractAddress);
    regeneratorContract = RegeneratorRules(contractDependency.regeneratorContractAddress);
    validatorContract = ValidatorRules(contractDependency.validatorContractAddress);
    inspectorContract = InspectorRules(contractDependency.inspectorContractAddress);
    categoryContract = RegenerationIndexRules(contractDependency.categoryContractAddress);
    activistContract = ActivistRules(contractDependency.activistContractAddress);
  }

  /**
   * @dev Allows the current user regenerator/inspector get all yours inspections with status INSPECTED
   */
  function getInspectionsHistory() public view returns (uint256[] memory) {
    return userInspections[msg.sender];
  }

  /**
   * @dev Allows the current user (regenerator) request a inspection.
   */
  function requestInspection() public {
    Regenerator memory regenerator = regeneratorContract.getRegenerator(msg.sender);

    require(userContract.userTypeIs(UserType.REGENERATOR, msg.sender), "Please register as regenerator");
    require(!regenerator.pendingInspection, "Request already OPEN");
    require(waitToRequest(regenerator), "Wait to request");
    require(
      !regenerator.regenerationScore.sustainable,
      "You can't request inspections anymore, you have completed your mission"
    );

    createInspection();

    afterRequestInspection();
  }

  function createInspection() internal {
    Inspection memory inspection;

    inspection.id = inspectionsCount + 1;
    inspection.status = InspectionStatus.OPEN;
    inspection.regenerator = msg.sender;
    inspection.inspector = address(0);
    inspection.createdAt = block.number;
    inspections[inspection.id] = inspection;
    inspectionsCount++;
  }

  function afterRequestInspection() internal {
    regeneratorContract.afterRequestInspection(msg.sender);
  }

  /**
   * @dev Allows the current user (inspector) accept a inspection.
   * @param inspectionId The id of the inspection that the inspector want accept.
   */
  function acceptInspection(uint256 inspectionId) public {
    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectorContract.isInspectorValid(msg.sender), "No more than 3 giveUps allowed");

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

    regeneratorContract.afterAcceptInspection(inspection.regenerator);
    inspectorContract.afterAcceptInspection(msg.sender, inspectionId);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED
   * @param inspectionId The id of the inspection to be realized
   * @param _regenerationInspection The RegenerationInspection[] of the inspection to be realized
   */
  function realizeInspection(
    uint256 inspectionId,
    string memory proofPhoto,
    string memory report,
    RegenerationInspection[] memory _regenerationInspection
  ) public {
    Inspection memory inspection = inspections[inspectionId];

    require(_regenerationInspection.length == 4, "Invalid regenerationIndex length");
    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspection.status == InspectionStatus.ACCEPTED, "Accept this inspection before");
    require(inspection.inspector == msg.sender, "You have not accepted this inspection");
    require(!(block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection), "Inspection Expired");

    markAsRealized(inspection, proofPhoto, report, _regenerationInspection);

    afterRealizeInspection(inspection);

    inspectorInspected[msg.sender][inspection.regenerator] = true;
  }

  function markAsRealized(
    Inspection memory inspection,
    string memory proofPhoto,
    string memory report,
    RegenerationInspection[] memory _regenerationInspection
  ) internal {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.regenerationScore = categoryContract.calculateScore(_regenerationInspection);
    inspection.proofPhoto = proofPhoto;
    inspection.report = report;
    inspection.inspectedAt = block.number;
    inspection.inspectedAtEra = regeneratorContract.regeneratorPoolEra();

    inspections[inspection.id] = inspection;

    regenerationInspection[inspection.id].push(_regenerationInspection[0]);
    regenerationInspection[inspection.id].push(_regenerationInspection[1]);
    regenerationInspection[inspection.id].push(_regenerationInspection[2]);
    regenerationInspection[inspection.id].push(_regenerationInspection[3]);
  }

  /**
   * @dev Inscrement regenerator and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address regeneratorAddress = inspection.regenerator;
    address inspectorAddress = inspection.inspector;

    activistContract.addLevel(
      regeneratorAddress,
      regeneratorContract.afterRealizeInspection(regeneratorAddress, inspection.regenerationScore),
      inspectorAddress,
      inspectorContract.afterRealizeInspection(inspectorAddress)
    );

    userInspections[regeneratorAddress].push(inspection.id);
    userInspections[inspectorAddress].push(inspection.id);
  }

  function addInspectionValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Inspection memory inspection = inspections[id];

    require(inspection.inspectedAtEra == regeneratorContract.regeneratorPoolEra(), "Can not add validation anymore");

    inspection.validationsCount += 1;
    inspections[inspection.id] = inspection;

    bool mustInvalidateInspection = inspection.validationsCount >= validatorContract.majorityValidatorsCount();

    if (mustInvalidateInspection) invalidateInspection(inspection);

    validatorContract.addInspectionValidation(inspection, justification, msg.sender);
  }

  function invalidateInspection(Inspection memory inspection) internal {
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
   * @dev List RegenerationInspection from inspection
   * @param inspectionId The id of the inspection to get RegenerationInspection
   */
  function getRegenerationInspection(uint256 inspectionId) public view returns (RegenerationInspection[] memory) {
    return regenerationInspection[inspectionId];
  }

  function waitToRequest(Regenerator memory regenerator) public view returns (bool) {
    if (regenerator.totalInspections < allowedInitialRequests) return true;

    return block.number > regenerator.lastRequestAt + timeBetweenInspections;
  }

  function calculateBlocksToExpire(uint256 inspectionId) public view returns (uint256) {
    return inspections[inspectionId].acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  function alreadyHaveInspectionAccepted() private view returns (bool) {
    Inspector memory inspector = inspectorContract.getInspector(msg.sender);
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
    if (regeneratorContract.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return regeneratorContract.nextEraIn().sub(blocksToExpireAcceptedInspection) > securityBlocksToValidatorAnalysis;
  }
}
