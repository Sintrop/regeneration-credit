// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { ProducerContract } from "./ProducerContract.sol";
import { InspectorContract } from "./InspectorContract.sol";
import { CategoryContract } from "./CategoryContract.sol";
import { ValidatorContract } from "./ValidatorContract.sol";
import { CategoryContract } from "./CategoryContract.sol";
import { ActivistContract } from "./ActivistContract.sol";
import { UserContract } from "./UserContract.sol";
import { InspectionStatus, IsaInspection, Inspection } from "./types/InspectionTypes.sol";
import { Producer } from "./types/ProducerTypes.sol";
import { Inspector } from "./types/InspectorTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { ContractsDependency } from "./types/SintropTypes.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title SintropContract
 * @dev Manage inspections rules and data
 * @notice Allow producer to request inspection, and inspectors to accept and realize it
 */
contract Sintrop is Callable {
  using SafeMath for uint256;

  mapping(address => mapping(address => bool)) internal inspectorInspected;
  mapping(address => uint256[]) internal userInspections;
  mapping(uint256 => Inspection) internal inspections;
  mapping(uint256 => IsaInspection[]) public isaInspections;
  mapping(address => mapping(uint256 => bool)) internal validatorValidations;

  InspectorContract private inspectorContract;
  ProducerContract private producerContract;
  UserContract private userContract;
  ValidatorContract private validatorContract;
  ActivistContract private activistContract;
  CategoryContract private categoryContract;

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
    userContract = UserContract(contractDependency.userContractAddress);
    producerContract = ProducerContract(contractDependency.producerContractAddress);
    validatorContract = ValidatorContract(contractDependency.validatorContractAddress);
    inspectorContract = InspectorContract(contractDependency.inspectorContractAddress);
    categoryContract = CategoryContract(contractDependency.categoryContractAddress);
    activistContract = ActivistContract(contractDependency.activistContractAddress);
  }

  /**
   * @dev Allows the current user producer/inspector get all yours inspections with status INSPECTED
   */
  function getInspectionsHistory() public view returns (uint256[] memory) {
    return userInspections[msg.sender];
  }

  /**
   * @dev Allows the current user (producer) request a inspection.
   */
  function requestInspection() public {
    Producer memory producer = producerContract.getProducer(msg.sender);

    require(userContract.userTypeIs(UserType.PRODUCER, msg.sender), "Please register as producer");
    require(!producer.pendingInspection, "Request already OPEN");
    require(waitToRequest(producer), "Wait to request");
    require(!producer.isa.sustainable, "You can't request inspections anymore, you have completed your mission");

    createInspection();

    afterRequestInspection();
  }

  function createInspection() internal {
    Inspection memory inspection;

    inspection.id = inspectionsCount + 1;
    inspection.status = InspectionStatus.OPEN;
    inspection.producer = msg.sender;
    inspection.inspector = address(0);
    inspection.createdAt = block.number;
    inspections[inspection.id] = inspection;
    inspectionsCount++;
  }

  function afterRequestInspection() internal {
    producerContract.afterRequestInspection(msg.sender);
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
    require(!inspectorInspected[msg.sender][inspection.producer], "Already inspected this producer");
    require(!inspectorInspected[msg.sender][inspection.producer], "Already inspected this producer");
    require(inspection.status == InspectionStatus.OPEN, "This inspection is not OPEN");
    require(acceptInspectionDelayBlocksPassed(inspection), "Wait inspection delay blocks");
    require(beforeAcceptHaveSecurityBlocksToVote(), "Wait until next era to accept");

    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = block.number;
    inspection.inspector = msg.sender;
    inspections[inspectionId] = inspection;

    producerContract.afterAcceptInspection(inspection.producer);
    inspectorContract.afterAcceptInspection(msg.sender, inspectionId);
  }

  /**
   * @dev Allow a inspector realize a inspection and mark as INSPECTED
   * @param inspectionId The id of the inspection to be realized
   * @param _isaInspections The IsaIsaInspection[] of the inspection to be realized
   */
  function realizeInspection(
    uint256 inspectionId,
    string memory proofPhoto,
    string memory report,
    IsaInspection[] memory _isaInspections
  ) public {
    Inspection memory inspection = inspections[inspectionId];

    require(_isaInspections.length == 4, "Invalid isas length");
    require(userContract.userTypeIs(UserType.INSPECTOR, msg.sender), "Please register as inspector");
    require(inspection.status == InspectionStatus.ACCEPTED, "Accept this inspection before");
    require(inspection.inspector == msg.sender, "You have not accepted this inspection");
    require(!(block.number > inspection.acceptedAt + blocksToExpireAcceptedInspection), "Inspection Expired");

    markAsRealized(inspection, proofPhoto, report, _isaInspections);

    afterRealizeInspection(inspection);

    inspectorInspected[msg.sender][inspection.producer] = true;
  }

  function markAsRealized(
    Inspection memory inspection,
    string memory proofPhoto,
    string memory report,
    IsaInspection[] memory _isaInspections
  ) internal {
    inspection.status = InspectionStatus.INSPECTED;
    inspection.isaScore = categoryContract.calculateScore(_isaInspections);
    inspection.proofPhoto = proofPhoto;
    inspection.report = report;
    inspection.inspectedAt = block.number;
    inspection.inspectedAtEra = producerContract.producerPoolEra();

    inspections[inspection.id] = inspection;

    isaInspections[inspection.id].push(_isaInspections[0]);
    isaInspections[inspection.id].push(_isaInspections[1]);
    isaInspections[inspection.id].push(_isaInspections[2]);
    isaInspections[inspection.id].push(_isaInspections[3]);
  }

  /**
   * @dev Inscrement producer and inspector request actions
   * @param inspection the inspected inspection
   */
  function afterRealizeInspection(Inspection memory inspection) internal {
    address producerAddress = inspection.producer;
    address inspectorAddress = inspection.inspector;

    activistContract.addLevel(
      producerAddress,
      producerContract.afterRealizeInspection(producerAddress, inspection.isaScore),
      inspectorAddress,
      inspectorContract.afterRealizeInspection(inspectorAddress)
    );

    userInspections[producerAddress].push(inspection.id);
    userInspections[inspectorAddress].push(inspection.id);
  }

  function addInspectionValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Inspection memory inspection = inspections[id];

    require(inspection.inspectedAtEra == producerContract.producerPoolEra(), "Can not add validation anymore");

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
   * @dev List IsaInspection from inspection
   * @param inspectionId The id of the inspection to get IsaInspection
   */
  function getIsa(uint256 inspectionId) public view returns (IsaInspection[] memory) {
    return isaInspections[inspectionId];
  }

  function waitToRequest(Producer memory producer) public view returns (bool) {
    if (producer.totalInspections < allowedInitialRequests) return true;

    return block.number > producer.lastRequestAt + timeBetweenInspections;
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
    if (producerContract.nextEraIn() < blocksToExpireAcceptedInspection) return false;

    return producerContract.nextEraIn().sub(blocksToExpireAcceptedInspection) > securityBlocksToValidatorAnalysis;
  }
}
