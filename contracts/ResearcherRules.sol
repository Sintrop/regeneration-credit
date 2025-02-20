// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { Researcher, Research, Pool, CalculatorItem, Penalty } from "./types/ResearcherTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";
import { ValidatorRules } from "./ValidatorRules.sol";

/**
 * @author Sintrop
 * @title ResearcherRules
 * @dev Manage researchers rules and data
 * @notice Responsible for developing evaluation methodologies
 */
contract ResearcherRules is Callable, Invitable {
  mapping(address => Researcher) internal researchers;
  mapping(uint256 => Research) public researches;
  mapping(uint256 => CalculatorItem) public calculatorItems;
  mapping(address => Penalty[]) public penalties;
  mapping(uint256 => address) public researchersAddress;

  CommunityRules internal communityRules;
  ResearcherPool internal researcherPool;
  ValidatorRules internal validatorRules;

  UserType private constant USER_TYPE = UserType.RESEARCHER;
  uint256 public researchesCount;
  uint256 public researchesTotalCount;
  uint256 public calculatorItemsCount;
  uint256 internal immutable timeBetweenResearches;

  uint256 public immutable MAX_PENALTIES;
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address communityRulesAddress,
    address researcherPoolAddress,
    address validatorRulesAddress,
    uint256 timeBetweenResearches_,
    uint256 maxPenalties_,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    researcherPool = ResearcherPool(researcherPoolAddress);
    validatorRules = ValidatorRules(validatorRulesAddress);
    timeBetweenResearches = timeBetweenResearches_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  /**
   * @dev Allows a user to attempt to register as a researcher
   * @param name The name of the researcher
   * @param proofPhoto Identity photo
   */
  function addResearcher(string memory name, string memory proofPhoto) public returns (Researcher memory) {
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Researcher memory researcher = Researcher(
      id,
      msg.sender,
      name,
      Pool(0, researcherPoolEra()),
      proofPhoto,
      0,
      0,
      0,
      block.number
    );

    researchers[msg.sender] = researcher;
    researchersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);

    return researcher;
  }

  function canSendInvite(address addr) public view returns (bool) {
    Researcher memory researcher = getResearcher(addr);

    if (researcher.id <= 0) return false;

    return canInvite(researchesTotalCount, communityRules.userTypesTotalCount(USER_TYPE), researcher.pool.level);
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
  function addResearch(string memory title, string memory thesis, string memory file) public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add research");
    require(canPublishResearch(msg.sender), "Can't publish yet");

    Researcher storage researcher = researchers[msg.sender];
    researcher.pool.level++;

    uint256 id = researchesCount + 1;

    Research memory research = Research(
      id,
      researcherPoolEra(),
      msg.sender,
      title,
      thesis,
      file,
      0,
      true,
      0,
      block.number
    );

    researches[id] = research;
    researchesCount++;
    researchesTotalCount++;
    researcher.publishedResearches++;
    researcher.lastPublishedAt = block.number;

    researcherPool.addLevel(msg.sender, 1);
  }

  function addResearchValidation(uint256 id, string memory justification) public {
    require(communityRules.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Research memory research = researches[id];

    require(research.valid && research.era == researcherPoolEra(), "This research is not VALID");

    research.validationsCount += 1;
    researches[id] = research;

    bool mustInvalidateResearch = research.validationsCount >= validatorRules.majorityValidatorsCount();

    if (mustInvalidateResearch) invalidateResearch(research);

    validatorRules.addResearcherResearchValidation(research, justification, msg.sender);
  }

  function invalidateResearch(Research memory research) internal {
    researchesTotalCount--;
    research.valid = false;
    research.invalidatedAt = block.number;
    researches[research.id] = research;
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

  function addPenalty(address addr, uint256 researchId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(researchId));

    return totalPenalties(addr);
  }

  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Call withdraw function from researcherPool to try to claim tokens
   * @notice Withdraw regeneration credit from research service provided
   */
  function withdraw() public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Pool only to researchers");

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
   * @notice One calculatorItem per research
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
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");

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
   * @dev Return a specific calculatorItem
   * @param id of the calculatorItem
   */
  function getCalculatorItem(uint256 id) public view returns (CalculatorItem memory) {
    return calculatorItems[id];
  }

  /**
   * @dev Checks if user can publish a research
   * @return bool True if can
   * @param addr Msg.sender addresss
   */
  function canPublishResearch(address addr) internal view returns (bool) {
    Researcher memory researcher = researchers[addr];
    uint256 lastPublishedAt = researcher.lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenResearches;
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Checks if user can publish an calculatorItem
   * @return bool True if can
   * @param researcher Msg.sender addresss
   */
  function canPublishCalculatorItem(Researcher memory researcher) internal view returns (bool) {
    uint256 lastCalculatorItemAt = researcher.lastCalculatorItemAt;

    bool canPublish = block.number > lastCalculatorItemAt + timeBetweenResearches;
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
