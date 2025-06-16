// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";
import { VoteRules } from "./VoteRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { Researcher, Research, Pool, CalculatorItem, EvaluationMethod, Penalty, ContractsDependency } from "./types/ResearcherTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";
import { ValidationRules } from "./ValidationRules.sol";

/**
 * @title ResearcherRules
 * @author Sintrop
 * @dev Manages researcher rules and data.
 * @notice Contract for managing researcher users, research submissions, and evaluation methods within the system.
 */
contract ResearcherRules is Callable, Invitable {
  // --- State Variables ---

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

  // --- Events ---

  /**
   * @dev Emitted when a new researcher is successfully registered.
   * @param researcherAddress The address of the newly registered researcher.
   * @param researcherId The unique ID assigned to the researcher.
   * @param name The public name of the researcher.
   */
  event ResearcherRegistered(address indexed researcherAddress, uint256 researcherId, string name);

  /**
   * @dev Emitted when a new research report is published.
   * @param researchId The unique ID of the published research.
   * @param researcher The address of the researcher who published the research.
   * @param publishedAt The block number when the research was published.
   * @param era The era in which the research was published.
   */
  event ResearchPublished(uint256 indexed researchId, address indexed researcher, uint256 publishedAt, uint256 era);

  /**
   * @dev Emitted when a research is successfully invalidated by validators.
   * @param researchId The ID of the research that was invalidated.
   * @param invalidatedBy The address of the voter who performed the validation action (leading to invalidation).
   * @param justification A brief justification for the invalidation.
   */
  event ResearchInvalidated(uint256 indexed researchId, address indexed invalidatedBy, string justification);

  // --- Constructor ---

  /**
   * @dev Initializes the ResearcherRules contract with key immutable parameters.
   * These parameters define crucial operational behaviors that cannot be changed after deployment.
   * @param timeBetweenWorks_ Minimum number of blocks that must pass between a researcher's publications (research or calculator item).
   * @param maxPenalties_ The maximum number of penalties a researcher can accumulate before block.
   * @param securityBlocksToValidatorAnalysis The period in blocks before an era ends, during which new research cannot be added.
   * This allows validators sufficient time for analysis before era finalization.
   */
  constructor(uint256 timeBetweenWorks_, uint256 maxPenalties_, uint256 securityBlocksToValidatorAnalysis) {
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  // --- State-Modifying Functions ---

  /**
   * @dev onlyOwner function to set contracts dependency. This function must be called only once after the contract deploy and ownership must be renounced after
   * @param contractDependency Addresses of system contracts used
   */
  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    researcherPool = ResearcherPool(contractDependency.researcherPoolAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @notice Allows a user to register as a researcher.
   * @dev Requires the caller to have been previously invited (handled by `CommunityRules`)
   * and for researcher vacancies to be available.
   * @param name The public name or alias of the researcher (max 50 characters).
   * @param proofPhoto A hash or identifier for the researcher's identity photo/document (max 100 characters).
   */
  function addResearcher(string memory name, string memory proofPhoto) public {
    require(bytes(name).length <= 50 && bytes(proofPhoto).length <= 100, "Max 100 characters");
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

    // --- Event Emission ---
    emit ResearcherRegistered(msg.sender, id, name);
  }

  /**
   * @notice Allows a registered researcher to publish a new research report.
   * @dev Requires the caller to be a registered researcher, to be outside the security block window
   * (i.e., not too close to the end of an era), and to have waited the `timeBetweenWorks`
   * period since their last research publication.
   * @param title The title of the research paper (max 100 characters).
   * @param thesis A short description or thesis statement (max 300 characters).
   * @param file A hash or identifier for the research report file (max 100 characters).
   */
  function addResearch(string memory title, string memory thesis, string memory file) public {
    require(
      bytes(title).length <= 100 && bytes(thesis).length <= 300 && bytes(file).length <= 100,
      "Max characters reached"
    );
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only researchers");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era");
    require(canPublishResearch(msg.sender), "Can't publish yet");

    Researcher storage researcher = researchers[msg.sender];

    uint256 id = researchesTotalCount + 1;

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

    // --- Event Emission ---
    emit ResearchPublished(id, msg.sender, block.number, research.era);
  }

  /**
   * @notice Allows a voter to vote to invalidate a research.
   * @dev Requires the caller to be a registered voter, have sufficient level as defined by `VoteRules`,
   * and to have waited the `timeBetweenVotes` period (managed by `ValidationRules`).
   * If the validation count meets the threshold (`votesToInvalidate`), the research is marked as invalid.
   * @param id The ID of the research to validate.
   * @param justification A brief justification for invalidating the research (max 300 characters).
   */
  function addResearchValidation(uint256 id, string memory justification) public {
    require(bytes(justification).length <= 300, "Max 300 characters reached");
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    Research memory research = researches[id];

    require(research.valid && poolCurrentEra() <= research.era, "Research not VALID");

    research.validationsCount += 1;
    researches[id] = research;

    bool invalidate = research.validationsCount >= validationRules.votesToInvalidate();

    if (invalidate) {
      research = invalidateResearch(research);
      // --- Event Emission ---
      emit ResearchInvalidated(id, msg.sender, justification);
    }

    validationRules.addResearchValidation(research, justification, msg.sender);
  }

  /**
   * @notice Allows a researcher to publish a calculator item, used by users to calculate degradation.
   * @dev Requires the caller to be a registered researcher and to have waited the `timeBetweenWorks`
   * period since their last calculator item publication.
   * @param item The short name of the item (e.g., "Electricity", "Diesel") (max 35 characters).
   * @param thesis The combined title and brief result justification for the item (max 350 characters).
   * @param unit The unit of the item (e.g., "liters", "kWh", "kg") (max 20 characters).
   * @param carbonImpact The carbon impact in grams per unit (e.g., 200 for 200g CO2e/kWh).
   */
  function addCalculatorItem(
    string memory item,
    string memory thesis,
    string memory unit,
    uint256 carbonImpact
  ) public {
    require(
      bytes(item).length <= 35 && bytes(thesis).length <= 250 && bytes(unit).length <= 20,
      "Max characters reached"
    );
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only researchers");

    Researcher memory researcher = researchers[msg.sender];

    require(canPublishCalculatorItem(researcher), "Can't publish yet");

    uint256 id = calculatorItemsCount + 1;

    calculatorItems[id] = CalculatorItem(id, msg.sender, item, thesis, unit, carbonImpact);
    calculatorItemsCount++;
    researchers[msg.sender].lastCalculatorItemAt = block.number;
    researchers[msg.sender].publishedItems++;
  }

  /**
   * @notice Allows a researcher to publish an off-chain evaluation method or project.
   * @dev This function supports publishing a project or application that helps inspectors in analyzing regeneration areas, estimating the number of trees and biodiversity.
   * Each researcher is allowed to publish only one method.
   * @param title The title of the method (e.g., "Sattelite-driven Tree Counter") (max 100 characters).
   * @param research The associated paper or research link (e.g., IPFS hash or URL) (max 100 characters).
   * @param projectURL The URL of the project or code repository (max 100 characters).
   */
  function addEvaluationMethod(string memory title, string memory research, string memory projectURL) public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only researchers");
    require(researchers[msg.sender].canPublishMethod, "Only one method allowed");

    uint256 id = evaluationMethodsCount + 1;

    evaluationMethods[id] = EvaluationMethod(id, msg.sender, title, research, projectURL);
    evaluationMethodsCount++;
    researchers[msg.sender].canPublishMethod = false;
  }

  /**
   * @notice Allows a researcher to attempt to withdraw regeneration credit from the researcher pool.
   * @dev Requires the caller to be a registered researcher and to be eligible to withdraw tokens
   * (eligibility determined by `ResearcherPool` and includes having published at least one research in the current era).
   * Increments the researcher's `pool.currentEra` upon successful withdrawal attempt.
   */
  function withdraw() public {
    require(communityRules.userTypeIs(UserType.RESEARCHER, msg.sender), "Only researchers");

    Researcher memory researcher = researchers[msg.sender];
    uint256 currentEra = researcher.pool.currentEra;

    require(researcherPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    researchers[msg.sender].pool.currentEra++;

    researcherPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Remove pool levels from researcher
   * @param addr Researcher wallet
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    Researcher memory researcher = researchers[addr];

    researchers[addr].pool.level -= levelsToRemove > 0 ? levelsToRemove : researcher.pool.level;

    researcherPool.removePoolLevels(addr, levelsToRemove);
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

  // --- View Functions ---

  /**
   * @dev Checks if a researcher is eligible to send invitations.
   * @notice Returns `true` if the researcher can send invites based on total researches, total researchers, and their pool level.
   * @param addr The address of the researcher.
   * @return `true` if the researcher can send an invite, `false` otherwise.
   */
  function canSendInvite(address addr) public view returns (bool) {
    Researcher memory researcher = getResearcher(addr);

    if (researcher.id <= 0) return false;

    return canInvite(researchesTotalCount, communityRules.userTypesTotalCount(USER_TYPE), researcher.pool.level);
  }

  /**
   * @dev Retrieves the detailed data of a specific researcher.
   * @param addr The address of the researcher.
   * @return The `Researcher` struct containing their data.
   */
  function getResearcher(address addr) public view returns (Researcher memory) {
    return researchers[addr];
  }

  /**
   * @dev Retrieves the detailed data of a specific research.
   * @param id The ID of the research.
   * @return The `Research` struct containing its data.
   */
  function getResearch(uint256 id) public view returns (Research memory) {
    return researches[id];
  }

  /**
   * @notice Returns the total number of penalties received by a researcher.
   * @param addr The researcher's wallet address.
   * @return The total count of penalties.
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Current researcherPool era
   * @return uint256 Return the current contract pool era
   */
  function poolCurrentEra() public view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  /**
   * @dev Retrieves a specific calculator item by its ID.
   * @param id The ID of the calculator item.
   * @return The `CalculatorItem` struct containing its data.
   */
  function getCalculatorItem(uint256 id) public view returns (CalculatorItem memory) {
    return calculatorItems[id];
  }

  /**
   * @dev Calculates the remaining blocks until the next era of the researcher pool.
   * Relies on the `ResearcherPool` contract to provide era progression logic.
   * @return The number of blocks remaining until the next era.
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(researcherPool.nextEraIn(poolCurrentEra()));
  }

  // --- Internal / Private Helper Functions ---

  /**
   * @dev Internal helper function that invalidates a research by updating its status.
   * Decrements the total count of valid researches.
   * @param research The `Research` struct to be invalidated.
   */
  function invalidateResearch(Research memory research) internal returns (Research memory) {
    researchesCount--;
    research.valid = false;
    research.invalidatedAt = block.number;
    researches[research.id] = research;

    return research;
  }

  /**
   * @notice Checks if a researcher is eligible to publish a research.
   * @dev Calculates eligibility based on the `lastPublishedAt` block.number and `timeBetweenWorks`.
   * @param addr The address of the potential publisher.
   * @return `true` if the user can publish research, `false` otherwise.
   */
  function canPublishResearch(address addr) internal view returns (bool) {
    uint256 lastPublishedAt = researchers[addr].lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt <= 0;
  }

  /**
   * @dev Checks if a researcher is eligible to publish a calculator item.
   * @param researcher The `Researcher` struct of the potential publisher.
   * @return `true` if the user can publish a calculator item, `false` otherwise.
   */
  function canPublishCalculatorItem(Researcher memory researcher) internal view returns (bool) {
    uint256 lastCalculatorItemAt = researcher.lastCalculatorItemAt;

    bool canPublish = block.number > lastCalculatorItemAt + timeBetweenWorks;
    return canPublish || lastCalculatorItemAt <= 0;
  }
}
