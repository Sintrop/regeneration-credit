// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./Callable.sol";
import { UserContract } from "./UserContract.sol";
import { Researcher, Work, Pool, CalculatorItem, Penalty } from "./types/ResearcherTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";
import { ValidatorContract } from "./ValidatorContract.sol";

/**
 * @author Sintrop
 * @title ResearcherContract
 * @dev Manage researchers rules and data
 * @notice Responsible for developing evaluation methodologies
 */
contract ResearcherContract is Callable {
  mapping(address => Researcher) internal researchers;
  mapping(uint256 => Work) public works;
  mapping(uint256 => CalculatorItem) public calculatorItems;
  mapping(address => Penalty[]) public penalties;

  UserContract internal userContract;
  ResearcherPool internal researcherPool;
  ValidatorContract internal validatorContract;

  address[] internal researchersAddress;
  UserType private constant USER_TYPE = UserType.RESEARCHER;
  uint256 public worksCount;
  uint256 public calculatorItemsCount;
  uint256 internal immutable timeBetweenWorks;

  uint256 public immutable MAX_PENALTIES;
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address userContractAddress,
    address researcherPoolAddress,
    address validatorContractAddress,
    uint256 timeBetweenWorks_,
    uint256 maxPenalties_,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    userContract = UserContract(userContractAddress);
    researcherPool = ResearcherPool(researcherPoolAddress);
    validatorContract = ValidatorContract(validatorContractAddress);
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  /**
   * @dev Allows a user to attempt to register as a researcher
   * @param name The name of the researcher
   * @param proofPhoto Identity photo
   */
  function addResearcher(string memory name, string memory proofPhoto) public returns (Researcher memory) {
    Researcher memory researcher = Researcher(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      name,
      Pool(0, researcherPoolEra()),
      proofPhoto,
      0,
      0,
      0
    );

    researchers[msg.sender] = researcher;
    researchersAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);

    return researcher;
  }

  /**
   * @dev Returns all registered researchers
   * @return Researcher struct array
   */
  function getResearchers() public view returns (Researcher[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Researcher[] memory researcherList = new Researcher[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = researchersAddress[i];
      researcherList[i] = researchers[acAddress];
    }

    return researcherList;
  }

  /**
   * @dev Return a specific researcher
   * @param addr the address of the researcher.
   */
  function getResearcher(address addr) public view returns (Researcher memory) {
    return researchers[addr];
  }

  /**
   * @dev Check if a specific researcher exists
   * @return a bool that represent if a researcher exists or not
   */
  function researcherExists(address addr) public view returns (bool) {
    return bytes(researchers[addr].name).length > 0;
  }

  /**
   * @dev Allows a researcher to attempt to publish a research report
   * @notice Publish research before security blocks
   * @param title Paper title
   * @param thesis Short thesis description
   * @param file Hash of the report file
   */
  function addWork(string memory title, string memory thesis, string memory file) public {
    require(userContract.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add work");
    require(canPublishWork(msg.sender), "Can't publish yet");

    Researcher storage researcher = researchers[msg.sender];
    researcher.pool.level++;

    uint256 id = worksCount + 1;

    Work memory work = Work(id, researcherPoolEra(), msg.sender, title, thesis, file, 0, true, 0, block.number);

    works[id] = work;
    worksCount++;
    researcher.publishedWorks++;
    researcher.lastPublishedAt = block.number;

    researcherPool.addLevel(msg.sender, 1);
  }

  function addWorkValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Work memory work = works[id];

    require(work.valid && work.era == researcherPoolEra(), "This work is not VALID");

    work.validationsCount += 1;
    works[id] = work;

    bool mustInvalidateWork = work.validationsCount >= validatorContract.majorityValidatorsCount();

    if (mustInvalidateWork) invalidateWork(work);

    validatorContract.addResearcheWorkValidation(work, justification, msg.sender);
  }

  function invalidateWork(Work memory work) internal {
    work.valid = false;
    work.invalidatedAt = block.number;
    works[work.id] = work;
  }

  /**
   * @dev Remove pool levels from researcher
   * @param addr Researcher wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Researcher memory researcher = researchers[addr];

    researchers[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : researcher.pool.level;
    researcherPool.removePoolLevels(addr, researcherPoolEra(), removeSomeLevels);
  }

  function addPenalty(address addr, uint256 workId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(workId));

    return totalPenalties(addr);
  }

  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  function getWorks() public view returns (Work[] memory) {
    Work[] memory worksList = new Work[](worksCount);
    uint256 count = worksCount;

    for (uint256 i = 0; i < count; i++) {
      worksList[i] = works[i + 1];
    }

    return worksList;
  }

  /**
   * @dev Call withdraw function from researcherPool to try to claim tokens
   * @notice Withdraw regeneration credit from research service provided
   */
  function withdraw() public {
    require(userContract.userTypeIs(UserType.RESEARCHER, msg.sender), "Pool only to researchers");

    Researcher memory researcher = researchers[msg.sender];
    uint256 currentEra = researcher.pool.currentEra;

    require(researcherPool.canWithdraw(currentEra), "Can't approve withdraw");

    researchers[msg.sender].pool.currentEra++;

    researcherPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Current researcherPool era
   * @return uint256 Return the current contract pool era
   */
  function researcherPoolEra() internal view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  /**
   * @dev Allows a researcher to attempt to publish an calculatorItem to users calculate their degradation
   * @notice One calculatorItem per work
   * @param title CalculatorItem title
   * @param carbonImpact Kg of carbon
   * @param waterImpact M³ of water
   * @param soilImpact M² of water
   * @param waterImpact Units of life
   */
  function addCalculatorItem(
    string memory title,
    uint256 carbonImpact,
    uint256 waterImpact,
    uint256 soilImpact,
    uint256 biodiversityImpact
  ) public {
    require(userContract.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");

    Researcher memory researcher = researchers[msg.sender];

    require(canPublishCalculatorItem(researcher), "Can't publish yet");

    uint256 id = calculatorItemsCount + 1;

    CalculatorItem memory calculatorItem = CalculatorItem(
      id,
      msg.sender,
      title,
      carbonImpact,
      waterImpact,
      soilImpact,
      biodiversityImpact
    );

    calculatorItems[id] = calculatorItem;
    calculatorItemsCount++;
    researchers[msg.sender].lastCalculatorItemAt = block.number;
  }

  /**
   * @dev Checks if user can publish a work
   * @return bool True if can
   * @param addr Msg.sender addresss
   */
  function canPublishWork(address addr) internal view returns (bool) {
    Researcher memory researcher = researchers[addr];
    uint256 lastPublishedAt = researcher.lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Checks if user can publish an calculatorItem
   * @return bool True if can
   * @param researcher Msg.sender addresss
   */
  function canPublishCalculatorItem(Researcher memory researcher) internal view returns (bool) {
    uint256 lastCalculatorItemAt = researcher.lastCalculatorItemAt;

    bool canPublish = block.number > lastCalculatorItemAt + timeBetweenWorks;
    return canPublish || lastCalculatorItemAt == 0;
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(researcherPool.nextEraIn(researcherPoolEra()));
  }
}
