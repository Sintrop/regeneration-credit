// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/ProducerTypes.sol";
import "./Callable.sol";
import "./ProducerPool.sol";

/**
 * @title ProducerContract
 * @dev Producer resource that represent a user that can request a inspection
 */
contract ProducerContract is Callable {
  mapping(address => Producer) public producers;

  uint256 internal constant MINIMUM_INSPECTION_POOL = 3;
  int256 internal constant MAXIMUM_ISA_SCORE_POOL = 1000;

  UserContract internal userContract;
  ProducerPool internal producerPool;

  address[] internal producersAddress;
  uint256 public producersCount;
  uint256 public producersSustainable;
  int256 public producersTotalScore;

  constructor(address userContractAddress, address producerPoolAddress) {
    userContract = UserContract(userContractAddress);
    producerPool = ProducerPool(producerPoolAddress);
  }

  /**
   * @dev Allow a new register of producer
   * @param name the name of the producer
   * @param document the document of producer
   * @param documentType the document type of producer. CPF/CNPJ
   * @param country the country where the producer is
   * @param state the state of the producer
   * @param city the of the producer
   * @param cep the cep of the producer
   */
  function addProducer(
    string memory name,
    string memory proofPhoto,
    string memory document,
    string memory documentType,
    string memory country,
    string memory state,
    string memory city,
    string memory street,
    string memory complement,
    string memory cep
  ) public uniqueProducer {
    UserType userType = UserType.PRODUCER;

    // TODO: Create issue to create producer instance before, so add just the required fields
    Producer memory producer = Producer(
      producersCount + 1,
      msg.sender,
      userType,
      name,
      proofPhoto,
      UserDocument(document, documentType),
      false,
      0,
      0,
      Isa(0, 0, false),
      PropertyAddress(country, state, city, street, complement, cep),
      Pool(producerPool.currentContractEra())
    );

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
    Producer[] memory producerList = new Producer[](producersCount);

    for (uint256 i = 0; i < producersCount; i++) {
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
    require(producerExists(msg.sender), "Only producers pool");

    Producer memory producer = producers[msg.sender];

    require(minimumInspections(producer.totalInspections), "minimum inspections");
    require(!maximumIsaScore(producer.isa.isaScore), "Limit ISA Score");
    // TODO: Create issue to add validation by last 12 eras

    producerPool.withdraw(
      msg.sender,
      producersTotalScore,
      producer.isa.isaScore,
      producer.pool.currentEra
    );

    incrementCurrentEra(msg.sender);
  }

  function minimumInspections(uint256 totalInspections) internal pure returns (bool) {
    return totalInspections >= MINIMUM_INSPECTION_POOL;
  }

  function maximumIsaScore(int256 isaScore) internal pure returns (bool) {
    return isaScore >= MAXIMUM_ISA_SCORE_POOL;
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

  // TODO: Create issue to refact this function (setIsaScore, checkSustainable)
  function setIsaScore(address addr, int256 isaScore) public mustBeAllowedCaller {
    Producer memory producer = producers[addr];

    int256 score = producer.isa.isaScore + isaScore;

    producer.isa.isaScore += isaScore;
    producers[addr] = producer;

    if (!producer.isa.sustainable) {
      if (score < 0) isaScore = isaScore - (-10);

      producersTotalScore += isaScore;
    }

    checkSustainable(producer);
  }

  // TODO: Create issue to refact this function
  function checkSustainable(Producer memory producer) internal {
    if (!producer.isa.sustainable && maximumIsaScore(producer.isa.isaScore)) {
      producersSustainable++;
      producers[producer.producerWallet].isa.sustainable = true;
      producersTotalScore -= producer.isa.isaScore;
    }
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

  // TODO: Add require inside funtion addProducer and remove modifier
  modifier uniqueProducer() {
    require(!producerExists(msg.sender), "This producer already exist");
    _;
  }
}
