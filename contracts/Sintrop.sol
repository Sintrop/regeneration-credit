// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { ProducerContract } from "./ProducerContract.sol";
import { InspectorContract } from "./InspectorContract.sol";
import { CategoryContract } from "./CategoryContract.sol";
import { InspectionStatus, IsaInspection, Inspection } from "./types/InspectionTypes.sol";
import { Producer } from "./types/ProducerTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { UserContract } from "./UserContract.sol";
import { UserType, Invitation } from "./types/UserTypes.sol";
import { ValidatorContract } from "./ValidatorContract.sol";
import { ActivistContract } from "./ActivistContract.sol";
import { CategoryContract } from "./CategoryContract.sol";

/**
 * @title SintropContract
 * @dev Sintrop application to certificate a rural producer
 */
contract Sintrop {
  mapping(address => mapping(address => bool)) internal inspectorInspected;
  mapping(address => Inspection[]) internal userInspections;
  mapping(uint256 => Inspection) internal inspections;
  mapping(address => mapping(uint256 => bool)) internal validatorValidations;

  InspectorContract public inspectorContract;
  ProducerContract public producerContract;
  UserContract public userContract;
  ValidatorContract public validatorContract;
  ActivistContract public activistContract;
  CategoryContract public categoryContract;

  uint256 public inspectionsCount;
  uint256 internal immutable timeBetweenInspections;
  uint256 internal blocksToExpireAcceptedInspection;
  uint256 internal immutable allowedInitialRequests;
  uint256 internal acceptInspectionDelayBlocks;

  constructor(
    address inspectorContractAddress,
    address producerContractAddress,
    address userContractAddress,
    address validatorContractAddress,
    address activistContractAddress,
    address categoryContractAddress,
    uint256 timeBetweenInspections_,
    uint256 blocksToExpireAcceptedInspection_,
    uint256 allowedInitialRequests_,
    uint256 acceptInspectionDelayBlocks_
  ) {
    inspectorContract = InspectorContract(inspectorContractAddress);
    producerContract = ProducerContract(producerContractAddress);
    userContract = UserContract(userContractAddress);
    validatorContract = ValidatorContract(validatorContractAddress);
    activistContract = ActivistContract(activistContractAddress);
    categoryContract = CategoryContract(categoryContractAddress);
    timeBetweenInspections = timeBetweenInspections_;
    blocksToExpireAcceptedInspection = blocksToExpireAcceptedInspection_;
    allowedInitialRequests = allowedInitialRequests_;
    acceptInspectionDelayBlocks = acceptInspectionDelayBlocks_;
  }

  // TODO: Refact this mapping to not duplicate inspections
  /**
   * @dev Allows the current user producer/inspector get all yours inspections with status INSPECTED
   */
  function getInspectionsHistory() public view returns (Inspection[] memory) {
    return userInspections[msg.sender];
  }

  // TODO: Remove not reutilized modifiers and use require direct in the function
  /**
   * @dev Allows the current user (producer) request a inspection.
   */
  function requestInspection() public {
    require(userContract.userTypeIs(UserType.PRODUCER, msg.sender), "Please register as producer");
    require(!producerContract.getProducer(msg.sender).pendingInspection, "Request already OPEN");
    require(canRequestInspection(), "Wait to request");

    addRequest();

    afterRequestInspection();
  }

  function addRequest() internal {
    uint256 id = inspectionsCount + 1;
    Inspection memory inspection = inspections[id];

    inspection.id = id;
    inspection.status = InspectionStatus.OPEN;
    inspection.createdBy = msg.sender;
    inspection.acceptedBy = address(0);
    inspection.createdAt = block.number;
    inspections[inspection.id] = inspection;
    inspectionsCount++;
  }

  function afterRequestInspection() internal {
    producerContract.pendingInspection(msg.sender, true);
    producerContract.lastRequestAt(msg.sender, block.number);
  }

  /**
   * @dev Allows the current user (inspector) accept a inspection.
   * @param inspectionId The id of the inspection that the inspector want accept.
   */
  function acceptInspection(uint256 inspectionId) public {
    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectorContract.isInspectorValid(msg.sender), "No more than 3 giveUps allowed");

    Inspection memory inspection = inspections[inspectionId];

    require(inspectionExists(inspectionId), "This inspection do not exist");
    require(!inspectorInspected[msg.sender][inspection.createdBy], "Already inspected this producer");

    require(canAcceptInspection(inspectionId), "Can't accept yet");
    require(inspection.status == InspectionStatus.OPEN, "This inspection is not OPEN");

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.acceptedBy = msg.sender;
    inspections[inspectionId] = inspection;

    producerContract.pendingInspection(inspection.createdBy, false); // Talvez não precise, pois estamos usando a expiração da inspeção pra checar se o produtor pode solicitar uma nova inspeção
    inspectorContract.incrementGiveUps(msg.sender);

    inspectorContract.markLastInspection(msg.sender, block.number, inspectionId);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED
   * @param inspectionId The id of the inspection to be realized
   * @param _isaInspection The IsaIsaInspection[] of the inspection to be realized
   */
  function realizeInspection(uint256 inspectionId, string memory report, IsaInspection[] memory _isaInspection) public {
    Inspection memory inspection = inspections[inspectionId];

    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectionExists(inspectionId), "This inspection do not exist");
    require(isAccepted(inspectionId), "Accept this inspection before");
    require(isInspectorOwner(inspectionId), "You not accepted this inspection");
    require(!expiredInspection(inspectionId), "Inspection Expired");

    markAsRealized(inspection, report, _isaInspection);

    afterRealizeInspection(inspection);

    inspectorInspected[msg.sender][inspection.createdBy] = true;
  }

  function markAsRealized(
    Inspection memory inspection,
    string memory report,
    IsaInspection[] memory _isaInspection
  ) internal {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.isaScore = categoryContract.calculateIsa(inspection.id, _isaInspection);
    inspection.report = report;
    inspection.inspectedAt = block.number;

    inspections[inspection.id] = inspection;
  }

  // TODO: Refact this function
  /**
   * @dev Inscrement producer and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address createdBy = inspection.createdBy;
    address acceptedBy = inspection.acceptedBy;

    uint256 inspectorTotalInspections = inspectorContract.incrementInspections(acceptedBy);
    inspectorContract.decreaseGiveUps(acceptedBy);

    uint256 producerTotalInspections = producerContract.incrementInspections(createdBy);

    activistContract.addLevel(createdBy, producerTotalInspections, acceptedBy, inspectorTotalInspections);
    producerContract.setIsaScore(inspection.createdBy, inspection.isaScore);

    userInspections[createdBy].push(inspection);
    userInspections[acceptedBy].push(inspection);
  }

  function addInspectionValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Inspection memory inspection = inspections[id];

    require(inspection.status == InspectionStatus.INSPECTED, "This inspection is not INSPECTED");

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
   * @dev Returns all requested inspections.
   */
  function getInspections() public view returns (Inspection[] memory) {
    Inspection[] memory inspectionsList = new Inspection[](inspectionsCount);

    for (uint256 i = 0; i < inspectionsCount; i++) {
      inspectionsList[i] = inspections[i + 1];
    }

    return inspectionsList;
  }

  // TODO: Add specs to this function
  /**
   * @dev Check if an inspection exists in mapping.
   * @param id The id of the inspection that the inspector want accept.
   */
  function inspectionExists(uint256 id) public view returns (bool) {
    return inspections[id].id >= 1;
  }

  function isInspectorOwner(uint256 inspectionId) internal view returns (bool) {
    return inspections[inspectionId].acceptedBy == msg.sender;
  }

  function isAccepted(uint256 inspectionId) internal view returns (bool) {
    return inspections[inspectionId].status == InspectionStatus.ACCEPTED;
  }

  function canRequestInspection() public view returns (bool) {
    Producer memory producer = producerContract.getProducer(msg.sender);

    if (producer.totalInspections < allowedInitialRequests) return true;

    return block.number > producer.lastRequestAt + timeBetweenInspections;
  }

  function expiredInspection(uint256 inspectionId) internal view returns (bool) {
    Inspection memory inspection = inspections[inspectionId];
    uint256 expireInspectionAt = inspection.acceptedAt + blocksToExpireAcceptedInspection;

    return block.number > expireInspectionAt;
  }

  function calculateBlocksToExpire(uint256 inspectionId) public view returns (uint256) {
    Inspection memory inspection = inspections[inspectionId];

    return inspection.acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  function canAcceptInspection(uint256 inspectionId) internal view returns (bool) {
    Inspection memory inspection = inspections[inspectionId];
    Inspector memory inspector = inspectorContract.getInspector(msg.sender);
    Inspection memory lastInspection = inspections[inspector.lastInspection];

    bool waitedInspectionDelay = block.number > inspection.createdAt + acceptInspectionDelayBlocks;

    bool acceptedInspectionExpired = block.number > lastInspection.acceptedAt + blocksToExpireAcceptedInspection;

    bool finishedLastInspection = lastInspection.status == InspectionStatus.INSPECTED ||
      lastInspection.status == InspectionStatus.INVALIDATED;

    if (!waitedInspectionDelay) return false;

    return finishedLastInspection || acceptedInspectionExpired || inspector.lastInspection == 0;
  }
}
