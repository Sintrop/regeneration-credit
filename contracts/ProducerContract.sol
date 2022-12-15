// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/ProducerTypes.sol";
import "./Callable.sol";

/**
 * @title ProducerContract
 * @dev Producer resource that represent a user that can request a inspection
 */
contract ProducerContract is Callable {
  mapping(address => Producer) public producers;

  UserContract internal userContract;
  address[] internal producersAddress;
  uint256 public producersCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
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
      Isa(0, 0),
      TokenApprove(0, false),
      PropertyAddress(country, state, city, street, complement, cep)
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

    // TODO: Add producersCount in a memory variable before call in the for loop
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

  function updateIsaScore(address addr, int256 isaScore) public mustBeAllowedCaller {
    producers[addr].isa.isaScore += isaScore;
  }

  function incrementRequests(address addr) public mustBeAllowedCaller {
    producers[addr].totalRequests++;
  }

  function approveProducerNewTokens(address addr, uint256 numTokens)
    public
    mustBeAllowedCaller
  {
    uint256 tokens = producers[addr].tokenApprove.allowed;
    producers[addr].tokenApprove = TokenApprove(tokens += numTokens, false);
  }

  function lastRequestAt(address addr, uint256 blocksNumber) public mustBeAllowedCaller {
    producers[addr].lastRequestAt = blocksNumber;
  }

  function getProducerApprove(address address_) public view returns (uint256) {
    return producers[address_].tokenApprove.allowed;
  }

  function undoProducerApprove() internal returns (bool) {
    producers[msg.sender].tokenApprove = TokenApprove(0, false);
    return true;
  }

  // MODIFIERS

  modifier uniqueProducer() {
    require(!producerExists(msg.sender), "This producer already exist");
    _;
  }
}
