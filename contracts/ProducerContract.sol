// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Producer, Pool, AreaInformation } from "./types/ProducerTypes.sol";
import { Callable } from "./Callable.sol";
import { ProducerPool } from "./ProducerPool.sol";
import { UserType } from "./types/UserTypes.sol";

/**
 * @author Sintrop
 * @title ProducerContract
 * @dev Manage producer user logic.
 * @notice Person, family or a group of peolpe that are restoring nature
 */
contract ProducerContract is Callable {
  uint256 internal constant MINIMUM_INSPECTION_TO_POOL = 3;
  int256 internal constant LIMIT_ISA_SCORE_TO_POOL = 1000;

  mapping(address => Producer) public producers;

  UserContract internal userContract;
  ProducerPool internal producerPool;

  address[] internal producersAddress;
  UserType private constant USER_TYPE = UserType.PRODUCER;
  uint256 public producersSustainable;

  constructor(address userContractAddress, address producerPoolAddress) {
    userContract = UserContract(userContractAddress);
    producerPool = ProducerPool(producerPoolAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a producer
   * @param name The name of the producer
   * @param proofPhoto Identity photo
   * @param totalArea in hectares = 1 he = 10.000 m2
   * @param coordinates the coordinates of the producer area
   */
  function addProducer(
    uint256 totalArea,
    string memory name,
    string memory proofPhoto,
    string memory coordinates
  ) public {
    Producer memory producer = producers[msg.sender];

    producer.id = userContract.userTypesCount(USER_TYPE) + 1;
    producer.producerWallet = msg.sender;
    producer.name = name;
    producer.proofPhoto = proofPhoto;
    producer.areaInformation = AreaInformation(coordinates, totalArea);
    producer.pool = Pool(false, producerPool.currentContractEra());

    producers[msg.sender] = producer;
    producersAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Returns all registered producers
   * @return Producer struct array
   */
  function getProducers() public view returns (Producer[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Producer[] memory producerList = new Producer[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = producersAddress[i];
      producerList[i] = producers[acAddress];
    }

    return producerList;
  }

  /**
   * @dev Return a specific producer
   * @param addr the address of the producer.
   */
  function getProducer(address addr) public view returns (Producer memory producer) {
    return producers[addr];
  }

  /**
   * @dev Call withdraw function from producerPool to try to claim tokens
   * @notice Withdraw regeneration credit from regeneration service provided
   */
  function withdraw() public {
    require(userContract.userTypeIs(UserType.PRODUCER, msg.sender), "Only producers pool");

    Producer memory producer = producers[msg.sender];
    require(minimumInspections(producer.totalInspections), "Minimum inspections");

    producers[msg.sender].pool.currentEra++;

    producerPool.withdraw(msg.sender, producer.pool.currentEra);
  }

  function minimumInspections(uint256 totalInspections) private pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTION_TO_POOL;
  }

  function limitIsaScore(Producer memory producer) private pure returns (bool) {
    return producer.isa.isaScore >= LIMIT_ISA_SCORE_TO_POOL;
  }

  /**
   * @dev Check if a specific producer exists
   * @return a bool that represent if a producer exists or not
   */
  function producerExists(address addr) public view returns (bool) {
    return producers[addr].id > 0;
  }

  function pendingInspection(address addr, bool state) private {
    producers[addr].pendingInspection = state;
  }

  /**
   * @dev Check if a specific producer reached the maximum score
   * @return a bool that represent if a producer is sustainable or not
   */
  function isSustainable(address addr) public view returns (bool) {
    return producers[addr].isa.sustainable;
  }

  function setIsaScore(address addr, int256 isaScore) private {
    Producer memory producer = producers[addr];

    int256 beforeIsaScore = producer.isa.isaScore;
    producer.isa.isaScore += isaScore;
    producers[addr] = producer;

    if (limitIsaScore(producer)) changeProducerToSustainable(producer);
    if (!minimumInspections(producer.totalInspections)) return;
    if (isaScore > 0) addIsaScore(producer, beforeIsaScore, isaScore);
    if (isaScore < 0) removeIsaScore(producer, isaScore);
  }

  function addIsaScore(Producer memory producer, int256 beforeIsaScore, int256 isaScore) private {
    if (producer.isa.isaScore <= 0) return;
    uint256 levels;

    bool newScoreMakeProducerPositive = beforeIsaScore < 0;

    if (newScoreMakeProducerPositive) {
      levels = uint256(producer.isa.isaScore);
    } else {
      levels = producer.pool.onContractPool ? uint256(isaScore) : uint256(producer.isa.isaScore);
    }

    if (!producer.pool.onContractPool) producers[producer.producerWallet].pool.onContractPool = true;
    producerPool.addLevel(producer.producerWallet, levels, levels);
  }

  function removeIsaScore(Producer memory producer, int256 isaScore) internal {
    if (!producer.pool.onContractPool) return;

    producerPool.removeLevel(producer.producerWallet, uint256(-(isaScore)));
  }

  /**
   * @dev Remove pool levels from producer
   * @param addr Producer wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Producer memory producer = producers[addr];

    if (removeSomeLevels == 0) producers[addr].isa.isaScore = 0;
    if (removeSomeLevels > 0) producers[addr].isa.isaScore -= int256(removeSomeLevels);

    producerPool.removePoolLevels(addr, producer.pool.currentEra, removeSomeLevels);
  }

  function removeNegativeScore(address addr, int256 levels) public mustBeAllowedCaller {
    producers[addr].isa.isaScore += levels;
    producerPool.addLevel(addr, uint256(levels), uint256(levels));
  }

  function changeProducerToSustainable(Producer memory producer) internal {
    producersSustainable++;
    producers[producer.producerWallet].isa.sustainable = true;
  }

  function incrementInspections(address addr) private returns (uint256) {
    producers[addr].totalInspections++;

    return producers[addr].totalInspections;
  }

  function decrementInspections(address addr) public mustBeAllowedCaller {
    require(producers[addr].totalInspections > 0, "totalInspections invalid");

    producers[addr].totalInspections--;
  }

  function afterRequestInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, true);
    lastRequestAt(addr, block.number);
  }

  function afterAcceptInspection(address addr) public mustBeAllowedCaller {
    pendingInspection(addr, false);
  }

  function afterRealizeInspection(address addr, int256 score) public mustBeAllowedCaller returns (uint256) {
    uint256 totalInspections = incrementInspections(addr);

    setIsaScore(addr, score);

    return totalInspections;
  }

  function lastRequestAt(address addr, uint256 blocksNumber) private {
    producers[addr].lastRequestAt = blocksNumber;
  }

  /**
   * @dev Current producerPool era
   * @return uint256 Return the current contract pool era
   */
  function producerPoolEra() public view returns (uint256) {
    return producerPool.currentContractEra();
  }

  function nextEraIn() public view returns (uint256) {
    return uint256(producerPool.nextEraIn(producerPoolEra()));
  }
}
