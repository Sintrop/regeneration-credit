// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Producer, Pool, Isa, PropertyAddress } from "./types/ProducerTypes.sol";
import { Callable } from "./Callable.sol";
import { ProducerPool } from "./ProducerPool.sol";
import { UserType } from "./types/UserTypes.sol";

/**
 * @title ProducerContract
 * @dev Producer resource that represent a user that can request a inspection
 */
contract ProducerContract is Callable {
  uint256 internal constant MINIMUM_INSPECTION_TO_POOL = 3;
  int256 internal constant LIMIT_ISA_SCORE_TO_POOL = 1000;

  mapping(address => Producer) public producers;

  UserContract internal userContract;
  ProducerPool internal producerPool;

  address[] internal producersAddress;
  uint256 public producersCount;
  uint256 public producersSustainable;

  constructor(address userContractAddress, address producerPoolAddress) {
    userContract = UserContract(userContractAddress);
    producerPool = ProducerPool(producerPoolAddress);
  }

  /**
   * @dev Allow a new register of producer
   * @param name the name of the producer
   * @param coordinate the coordinate of the producer
   * @param certifiedArea in hectares = he = 10.000 m2
   */
  function addProducer(
    uint256 certifiedArea,
    string memory name,
    string memory proofPhoto,
    string memory coordinate
  ) public {
    require(!producerExists(msg.sender), "This producer already exist");

    UserType userType = UserType.PRODUCER;

    Producer memory producer = producers[msg.sender];

    producer.id = producersCount + 1;
    producer.producerWallet = msg.sender;
    producer.userType = userType;
    producer.certifiedArea = certifiedArea;
    producer.name = name;
    producer.proofPhoto = proofPhoto;
    producer.propertyAddress = PropertyAddress(coordinate);
    producer.pool = Pool(producerPool.currentContractEra());

    producers[msg.sender] = producer;
    producersAddress.push(msg.sender);
    producersCount++;
    userContract.addUser(msg.sender, userType);
  }

  /**
   * @dev Returns all registered producers
   * @return Producer struct array
   */
  function getProducers() public view returns (Producer[] memory) {
    uint256 count = producersCount;
    Producer[] memory producerList = new Producer[](count);

    for (uint256 i = 0; i < count; i++) {
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

  function withdraw() public {
    require(userContract.userTypeIs(UserType.PRODUCER, msg.sender), "Only producers pool");

    Producer memory producer = producers[msg.sender];
    require(minimumInspections(producer.totalInspections), "Minimum inspections");
    require(!limitIsaScore(producer), "Limit ISA Score");

    incrementCurrentEra(msg.sender);

    producerPool.withdraw(msg.sender, producer.pool.currentEra);
  }

  function minimumInspections(uint256 totalInspections) internal pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTION_TO_POOL;
  }

  function limitIsaScore(Producer memory producer) internal pure returns (bool) {
    return producer.isa.isaScore >= LIMIT_ISA_SCORE_TO_POOL;
  }

  /**
   * @dev Check if a specific producer exists
   * @return a bool that represent if a producer exists or not
   */
  function producerExists(address addr) public view returns (bool) {
    return producers[addr].id > 0;
  }

  function recentInspection(address addr, bool state) public mustBeAllowedCaller {
    producers[addr].recentInspection = state;
  }

  function setIsaScore(address addr, int256 isaScore) public mustBeAllowedCaller {
    Producer memory producer = producers[addr];

    producer.isa.isaScore += isaScore;
    producers[addr] = producer;

    uint256 currentlevel = producer.isa.isaScore < 0 ? 0 : uint256(producer.isa.isaScore);
    uint256 addLevels = isaScore < 0 ? 0 : uint256(isaScore);

    if (producer.isa.sustainable) return;

    if (limitIsaScore(producer)) changeProducerToSustainable(producer);

    if (!minimumInspections(producer.totalInspections)) return;

    producerPool.addLevel(addr, currentlevel, addLevels);
  }

  function resetLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Producer memory producer = producers[addr];

    producerPool.resetLevels(addr, producer.pool.currentEra, removeSomeLevels);
    producers[addr].isa.isaScore = 0;
  }

  function changeProducerToSustainable(Producer memory producer) internal {
    producersSustainable++;
    producers[producer.producerWallet].isa.sustainable = true;
  }

  function incrementCurrentEra(address addr) internal {
    producers[addr].pool.currentEra++;
  }

  function incrementInspections(address addr) public mustBeAllowedCaller {
    producers[addr].totalInspections++;
  }

  function lastRequestAt(address addr, uint256 blocksNumber) public mustBeAllowedCaller {
    producers[addr].lastRequestAt = blocksNumber;
  }
}
