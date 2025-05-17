// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";
import { VoteRules } from "./VoteRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { Researcher, Research, Pool, CalculatorItem, EvaluationMethod, Penalty, ContractsDependency } from "./types/ResearcherTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";
import { ValidationRules } from "./ValidationRules.sol";

/**
 * @author Sintrop
 * @title ResearcherRules
 * @dev Manage researchers rules and data
 * @notice Responsible for developing evaluation methodologies
 */
contract ResearcherRules is Callable, Invitable {
  /// @notice The relationship between address and researcher data
  mapping(address => Researcher) internal researchers;

  /// @notice The relationship between id and research data
  mapping(uint256 => Research) public researches;

  /// @notice The relationship between address and researches ids
  mapping(address => uint256[]) public researchesIds;

  /// @notice The relationship between id and calculatorItem data
  mapping(uint256 => CalculatorItem) public calculatorItems;

  /// @notice The relationship between id and evaluationMethods data
  mapping(uint256 => EvaluationMethod) public evaluationMethods;

  /// @notice The relationship between address and penalties received
  mapping(address => Penalty[]) public penalties;

  /// @notice The relationship between id and researcher address
  mapping(uint256 => address) public researchersAddress;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ResearcherPool contract address
  ResearcherPool internal researcherPool;

  /// @notice ValidatorPool contract address
  ValidationRules internal validationRules;

  /// @notice ValidationRules contract address
  VoteRules internal voteRules;

  /// @notice Researcher UserType
  UserType private constant USER_TYPE = UserType.RESEARCHER;

  /// @notice Total valid researches count
  uint256 public researchesCount;

  /// @notice Total researches count
  uint256 public researchesTotalCount;

  /// @notice Total calculatorItems count
  uint256 public calculatorItemsCount;

  /// @notice Total methods count
  uint256 public evaluationMethodsCount;

  /// @notice Waiting blocks to publish research
  uint256 internal immutable timeBetweenWorks;

  /// @notice Max allowed penalties before invalidation
  uint256 public immutable MAX_PENALTIES;

  /// @notice Number of blocks to block addResearch before the end of an era
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(uint256 timeBetweenWorks_, uint256 maxPenalties_, uint256 securityBlocksToValidatorAnalysis) {
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    researcherPool = ResearcherPool(contractDependency.researcherPoolAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @notice Allows a user to attempt to register as a researcher
   *
   * Requirements:
   *
   * - the caller must have been invited before
   * - vacancies according to the number of regenerators
   *
   * @param name The name of the researcher
   * @param proofPhoto Identity photo
   */
  function addResearcher(string memory name, string memory proofPhoto) public {
    require(bytes(name).length <= 100 && bytes(proofPhoto).length <= 100, "Max 100 characters");
    require(communityRules.userTypesCount(USER_TYPE) <= 16000, "Max limit reached");

    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Researcher memory researcher = Researcher(
      id,
      msg.sender,
      name,
      Pool(0, poolCurrentEra()),
      proofPhoto,
      0,
      0,
      0,
      0,
      block.number,
      true
    );

    researchers[msg.sender] = researcher;
    researchersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Checks if a researcher can send invite
   * @notice True if researcher can send invite
   * @param addr The researcher address
   */
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
   * @dev Returns a research
   * @param id researchId
   */
  function getResearch(uint256 id) public view returns (Research memory) {
    return researches[id];
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
    require(
      bytes(title).length <= 100 && bytes(thesis).length <= 500 && bytes(file).length <= 100,
      "Max characters reached"
    );

    Researcher storage researcher = researchers[msg.sender];

    uint256 id = researchesCount + 1;

    Research memory research = Research(
      id,
      poolCurrentEra(),
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

    researchesIds[msg.sender].push(id);

    researcher.pool.level++;
    researcherPool.addLevel(msg.sender, 1);
  }

  function getResearchesIds(address addr) public view returns (uint256[] memory) {
    return researchesIds[addr];
  }

  /**
   * @notice Allows a voter to attempt to vote to invalidate a research
   *
   * Requirements:
   *
   * - the caller must be a voter user
   * - caller level must be above average
   * - caller must have waited timeBetweenVotes
   *
   * @param id Resource id
   * @param justification Invalidation justification
   */
  function addResearchValidation(uint256 id, string memory justification) public {
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");
    require(bytes(justification).length <= 300, "Max 300 characters reached");

    Research memory research = researches[id];

    require(research.valid && poolCurrentEra() <= research.era, "This research is not VALID");

    research.validationsCount += 1;
    researches[id] = research;

    bool mustInvalidateResearch = research.validationsCount >= validationRules.votesToInvalidate();

    if (mustInvalidateResearch) invalidateResearch(research);

    validationRules.addResearchValidation(research, justification, msg.sender);
  }

  /**
   * @dev Function that invalidates a research
   * @param research Invalidated research
   */
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
    researcherPool.removePoolLevels(addr, poolCurrentEra(), removeSomeLevels);
  }

  /**
   * @dev Add researcher penalty when invalidating a research
   * @param addr Researcher wallet
   * @param researchId Research id
   */
  function addPenalty(address addr, uint256 researchId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(researchId));

    return totalPenalties(addr);
  }

  /**
   * @dev Returns addr number of penalties
   * @notice Number of penalties of an user
   * @param addr Researcher wallet
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Call withdraw function from researcherPool to try to claim tokens
   * @notice Withdraw regeneration credit from research service provided
   *
   * Requirements:
   *
   * - only to researchers
   * - to be eligible to withdraw tokens, you must have publisehd at least one research in the era
   *
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
  function poolCurrentEra() public view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  /**
   * @dev Allows a researcher to attempt to publish an calculatorItem to users calculate their degradation
   * @notice One calculatorItem per research
   * @param title CalculatorItem title
   * @param unit Unit of the item. Exapmle: liters, kwh, kg
   * @param justification Item result justification
   * @param carbonImpact Grams of carbon per unit [g]
   */
  function addCalculatorItem(
    string memory title,
    string memory unit,
    string memory justification,
    uint256 carbonImpact
  ) public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");

    Researcher memory researcher = researchers[msg.sender];

    require(canPublishCalculatorItem(researcher), "Can't publish yet");

    uint256 id = calculatorItemsCount + 1;

    calculatorItems[id] = CalculatorItem(id, msg.sender, title, unit, justification, carbonImpact);
    calculatorItemsCount++;
    researchers[msg.sender].lastCalculatorItemAt = block.number;
    researchers[msg.sender].publishedItems++;
  }

  /**
   * @dev Return a specific calculatorItem
   * @param id of the calculatorItem
   */
  function getCalculatorItem(uint256 id) public view returns (CalculatorItem memory) {
    return calculatorItems[id];
  }

  /**
   * @dev Allows a researcher to pulish an off-chain evaluation method or project
   * @notice Publish a project or application that can help inspectors analyze a regeneration area. Only one method allowed per researcher
   * @param title Method title
   * @param research Method paper or research
   * @param projectURL Project url or code repository
   */
  function addEvaluationMethod(string memory title, string memory research, string memory projectURL) public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");
    require(researchers[msg.sender].canPublishMethod, "Only one method allowed");

    uint256 id = evaluationMethodsCount + 1;

    evaluationMethods[id] = EvaluationMethod(id, msg.sender, title, research, projectURL);
    evaluationMethodsCount++;
    researchers[msg.sender].canPublishMethod = false;
  }

  /**
   * @notice Checks if user can publish a research
   * @return bool True if can
   * @param addr Msg.sender addresss
   */
  function canPublishResearch(address addr) internal view returns (bool) {
    uint256 lastPublishedAt = researchers[addr].lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt <= 0;
  }

  /**
   * @dev Checks if user can publish an calculatorItem
   * @return bool True if can
   * @param researcher Msg.sender addresss
   */
  function canPublishCalculatorItem(Researcher memory researcher) internal view returns (bool) {
    uint256 lastCalculatorItemAt = researcher.lastCalculatorItemAt;

    bool canPublish = block.number > lastCalculatorItemAt + timeBetweenWorks;
    return canPublish || lastCalculatorItemAt <= 0;
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(researcherPool.nextEraIn(poolCurrentEra()));
  }
}
