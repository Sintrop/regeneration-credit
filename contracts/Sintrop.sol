// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { ProducerContract } from "./ProducerContract.sol";
import { InspectorContract } from "./InspectorContract.sol";
import { CategoryContract } from "./CategoryContract.sol";
import { InspectionStatus, IsaInspection, Inspection } from "./types/InspectionTypes.sol";
import { Producer } from "./types/ProducerTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { ValidatorContract } from "./ValidatorContract.sol";
import { Validation } from "./types/ValidatorTypes.sol";

/**
 * @title SintropContract
 * @dev Sintrop application to certificate a rural producer
 */
contract Sintrop {
  mapping(address => mapping(address => bool)) internal inspectorInspected;
  mapping(address => Inspection[]) internal userInspections;
  mapping(uint256 => Inspection) internal inspections;
  mapping(uint256 => IsaInspection[]) public isas;
  mapping(uint256 => Validation[]) public validations;
  mapping(address => mapping(uint256 => bool)) internal validatorValidations;

  InspectorContract public inspectorContract;
  ProducerContract public producerContract;
  UserContract public userContract;
  ValidatorContract public validatorContract;

  uint256 public inspectionsCount;
  uint256 internal immutable timeBetweenInspections;
  uint256 internal blocksToExpireAcceptedInspection;
  uint256 internal immutable allowedInitialRequests;

  constructor(
    address inspectorContractAddress,
    address producerContractAddress,
    address userContractAddress,
    address validatorContractAddress,
    uint256 timeBetweenInspections_,
    uint256 blocksToExpireAcceptedInspection_,
    uint256 allowedInitialRequests_
  ) {
    inspectorContract = InspectorContract(inspectorContractAddress);
    producerContract = ProducerContract(producerContractAddress);
    userContract = UserContract(userContractAddress);
    validatorContract = ValidatorContract(validatorContractAddress);
    timeBetweenInspections = timeBetweenInspections_;
    blocksToExpireAcceptedInspection = blocksToExpireAcceptedInspection_;
    allowedInitialRequests = allowedInitialRequests_;
  }

  // TODO: Refact this mapping to not duplicate inspections
  /**
   * @dev Allows the current user producer/inspector get all yours inspections with status INSPECTED
   */
  function getInspectionsHistory() public view returns (Inspection[] memory) {
    return userInspections[msg.sender];
  }

  /**
   * @dev List IsaInspection from inspection
   * @param inspectionId The id of the inspection to get IsaInspection
   */
  function getIsa(uint256 inspectionId) public view returns (IsaInspection[] memory) {
    return isas[inspectionId];
  }

  // TODO: Remove not reutilized modifiers and use require direct in the function
  /**
   * @dev Allows the current user (producer) request a inspection.
   */
  function requestInspection() public {
    require(userContract.userTypeIs(UserType.PRODUCER, msg.sender), "Please register as producer");
    require(!producerContract.getProducer(msg.sender).recentInspection, "Request OPEN or ACCEPTED");
    require(canRequestInspection(), "Recent inspection");

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
    inspection.createdAtTimestamp = block.timestamp; // solhint-disable-line

    inspections[inspection.id] = inspection;
    inspectionsCount++;
  }

  function afterRequestInspection() internal {
    producerContract.recentInspection(msg.sender, true);
    producerContract.lastRequestAt(msg.sender, block.number);
  }

  /**
   * @dev Allows the current user (inspector) accept a inspection.
   * @param inspectionId The id of the inspection that the inspector want accept.
   */
  function acceptInspection(uint256 inspectionId) public {
    Inspection memory inspection = inspections[inspectionId];

    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectionExists(inspectionId), "This inspection don't exists");
    require(!inspectorInspected[msg.sender][inspection.createdBy], "Already inspected this producer");

    require(canAcceptInspection(), "Can't accept yet");
    require(inspection.status == InspectionStatus.OPEN, "This inspection is not OPEN");

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.acceptedAtTimestamp = block.timestamp; // solhint-disable-line
    inspection.acceptedBy = msg.sender;
    inspections[inspectionId] = inspection;

    producerContract.recentInspection(inspection.createdBy, false); // Talvez não precise, pois estamos usando a expiração da inspeção pra checar se o produtor pode solicitar uma nova inspeção
    inspectorContract.incrementGiveUps(msg.sender);

    inspectorContract.lastAcceptedAt(msg.sender, block.number);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED
   * @param inspectionId The id of the inspection to be realized
   * @param _isas The IsaIsaInspection[] of the inspection to be realized
   */
  function realizeInspection(uint256 inspectionId, IsaInspection[] memory _isas) public {
    Inspection memory inspection = inspections[inspectionId];

    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspectionExists(inspectionId), "This inspection don't exists");
    require(isAccepted(inspectionId), "Accept this inspection before");
    require(isInspectorOwner(inspectionId), "You not accepted this inspection");

    require(!expiredInspection(inspectionId), "Inspection Expired");

    markAsRealized(inspection, _isas);

    afterRealizeInspection(inspection);

    producerContract.setIsaScore(inspection.createdBy, inspection.isaScore);
    inspectorContract.lastInspectedAt(msg.sender, block.number);

    inspectorInspected[msg.sender][inspection.createdBy] = true;
  }

  function markAsRealized(Inspection memory inspection, IsaInspection[] memory _isas) internal {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.inspectedAtTimestamp = block.timestamp; // solhint-disable-line
    inspection.isaScore = calculateIsa(inspection, _isas);

    inspections[inspection.id] = inspection;
  }

  function calculateIsa(Inspection memory inspection, IsaInspection[] memory _isas) internal returns (int256) {
    int256[7] memory points = [int256(20), 10, 5, 0, -5, -10, -20];
    int256 isaScore;

    for (uint8 i = 0; i < _isas.length; i++) {
      isas[inspection.id].push(_isas[i]);
      uint256 isaIndex = _isas[i].isaIndex;
      isaScore += points[isaIndex];
    }

    return isaScore;
  }

  // TODO: Refact this function
  /**
   * @dev Inscrement producer and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address createdBy = inspection.createdBy;
    address acceptedBy = inspection.acceptedBy;

    // Increment inspector inspections and release to carry out new inspections
    inspectorContract.incrementInspections(acceptedBy);
    inspectorContract.decreaseGiveUps(acceptedBy);

    // Increment producer requests
    producerContract.incrementInspections(createdBy);

    userInspections[createdBy].push(inspection);
    userInspections[acceptedBy].push(inspection);
  }

  function addInspectionValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Inspection memory inspection = inspections[id];
    require(inspection.status == InspectionStatus.INSPECTED, "This inspection is not INSPECTED");
    require(!validatorValidations[msg.sender][id], "Already voted");

    validatorValidations[msg.sender][id] = true;

    inspection.validationsCount += 1;
    inspections[id] = inspection;

    uint256 majorityValidatorsCount_ = validatorContract.majorityValidatorsCount();
    uint256 validationsCount = inspections[id].validationsCount;
    bool addPenalty = validationsCount >= majorityValidatorsCount_;

    validations[id].push(
      Validation(
        msg.sender,
        inspection.acceptedBy,
        inspection.id,
        justification,
        majorityValidatorsCount_,
        block.timestamp, // solhint-disable-line
        block.number
      )
    );

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorContract.addPenalty(inspection.acceptedBy, inspection.id);
    invalidateInspection(inspection);

    if (inspectorTotalPenalties >= inspectorContract.maxPenalties())
      validatorContract.externalDenieUser(inspection.acceptedBy);
  }

  function invalidateInspection(Inspection memory inspection) internal {
    inspection.status = InspectionStatus.INVALIDATED;
    inspection.invalidatedAt = block.number;
    inspection.invalidatedAtTimestamp = block.timestamp; // solhint-disable-line
    inspections[inspection.id] = inspection;

    inspectorContract.decrementInspections(inspection.acceptedBy);
    producerContract.decrementInspections(inspection.createdBy);

    if (inspection.isaScore <= 0) return;

    uint256 levels = uint256(inspection.isaScore);

    validatorContract.externalRemoveLevels(inspection.createdBy, levels);
    validatorContract.externalRemoveLevels(inspection.acceptedBy, levels);
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

  // TODO: Have a better way to return this?
  // TODO: Is this function necessary?
  /**
   * @dev Returns all inpections status string.
   */
  function getInspectionsStatus() public pure returns (string memory, string memory, string memory, string memory) {
    return ("OPEN", "ACCEPTED", "INSPECTED", "EXPIRED");
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

  // TODO: Add specs to this function
  function canRequestInspection() public view returns (bool) {
    Producer memory producer = producerContract.getProducer(msg.sender);

    if (producer.totalInspections < allowedInitialRequests) return true;

    return block.number > producer.lastRequestAt + timeBetweenInspections;
  }

  // TODO: Add specs to this function if necessary
  // TODO: Must be a public function to call in the client?
  function expiredInspection(uint256 inspectionId) internal view returns (bool) {
    Inspection memory inspection = inspections[inspectionId];
    uint256 expireInspectionAt = inspection.acceptedAt + blocksToExpireAcceptedInspection;

    return block.number > expireInspectionAt;
  }

  // TODO: Add specs to this function
  // TODO: Rename to BlocksToExpireAcceptedInspection ?
  function calculateBlocksToExpire(uint256 inspectionId) public view returns (uint256) {
    Inspection memory inspection = inspections[inspectionId];

    return inspection.acceptedAt + blocksToExpireAcceptedInspection - block.number;
  }

  function canAcceptInspection() internal view returns (bool) {
    Inspector memory inspector = inspectorContract.getInspector(msg.sender);
    uint256 lastAcceptedAt = inspector.lastAcceptedAt;
    uint256 lastInspectedAt = inspector.lastInspectedAt;

    bool canAccept = block.number > lastAcceptedAt + blocksToExpireAcceptedInspection;
    bool finishedInspection = lastInspectedAt > lastAcceptedAt;

    return canAccept || lastAcceptedAt == 0 || finishedInspection;
  }
}
