// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Invitable } from "./shared/Invitable.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IResearcherPool } from "./interfaces/IResearcherPool.sol";
import { IValidationRules } from "./interfaces/IValidationRules.sol";
import { Researcher, Research, Pool, CalculatorItem, EvaluationMethod, Penalty, ContractsDependency } from "./types/ResearcherTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @title ResearcherRules
 * @author Sintrop
 * @notice This contract defines and manages the rules and data specific to "Researcher" users within the system.
 * Researchers are primarily responsible for the development of the project impact calculator, for the creation and improvement
 * of evaluation methods and through submitting researches, which are subject to validation and penalty mechanisms.
 * @dev Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
 * function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
 * for general user management, `ResearcherPool` for reward distribution, `VoteRules` for voting
 * eligibility, and `ValidationRules` for research validation processes.
 */
contract ResearcherRules is Callable, Invitable, ReentrancyGuard {
  // --- Constants ---

  /// @notice Maximum users count allowed for this UserType.
  uint16 public constant MAX_USER_COUNT = 16000;

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Max character length for text.
  uint16 private constant MAX_TEXT_LENGTH = 300;

  /// @notice Max character length for title.
  uint16 private constant MAX_TITLE_LENGTH = 100;

  /// @notice Max character length for calculator item name.
  uint16 private constant MAX_ITEM_LENGTH = 35;

  /// @notice Max character length for calculator item unit.
  uint16 private constant MAX_UNIT_LENGTH = 20;

  /// @notice Maximum possible level from a single resource.
  uint8 private constant RESOURCE_LEVEL = 1;

  /// Minimum 1g CO2e per unit
  uint256 constant MIN_CARBON_IMPACT = 1;

  /// Maximum 1 ton CO2e per unit
  uint256 constant MAX_CARBON_IMPACT = 1000000;

  // --- State variables ---

  /// @notice The maximum number of penalties a researcher can accumulate before facing invalidation.
  uint8 public immutable maxPenalties;

  /// @notice Waiting blocks to publish research.
  uint32 public immutable timeBetweenWorks;

  /// @notice The number of blocks before the end of an era during which no new researchs can be published.
  /// This period allows validators sufficient time to analyze and vote on researchs before the era concludes.
  uint32 public immutable securityBlocksToValidation;

  /// @notice The total count of researchs that are currently considered valid (not invalidated).
  uint64 public researchesCount;

  /// @notice The grand total count of all researchs ever submitted, including invalidated ones.
  /// This acts as a global unique ID counter for new researchs.
  uint64 public researchesTotalCount;

  /// @notice The sum of all active levels from valid researches by non-denied researchers.
  uint256 public totalActiveLevels;

  /// @notice Total calculatorItems count.
  uint64 public calculatorItemsCount;

  /// @notice Total methods count.
  uint64 public evaluationMethodsCount;

  /// @notice A mapping from a researcher's wallet address to their detailed `Researcher` data structure.
  /// This serves as the primary storage for researcher profiles.
  mapping(address => Researcher) private researchers;

  /// @notice A mapping from a unique research ID to its detailed `Research` data structure.
  /// Stores all submitted researchs.
  mapping(uint256 => Research) public researches;

  /// @notice A mapping from a researcher's wallet address to an array of IDs of researchs they have submitted.
  mapping(address => uint256[]) public researchesIds;

  /// @notice The relationship between id and calculatorItem data.
  mapping(uint64 => CalculatorItem) public calculatorItems;

  /// @notice The relationship between id and evaluationMethods data.
  mapping(uint256 => EvaluationMethod) public evaluationMethods;

  /// @notice A mapping from a researcher's wallet address to an array of `Penalty` structs they have received.
  mapping(address => Penalty[]) public penalties;

  /// @notice Tracks research IDs that have already been invalidated.
  mapping(uint64 => bool) public researchPenalized;

  /// @notice A mapping from a unique reseracher ID to their corresponding wallet address.
  /// Facilitates lookup of a reseracher's address by their ID.
  mapping(uint256 => address) public researchersAddress;

  /// @notice The interface of the `CommunityRules` contract, used to interact with
  /// community-wide rules, user types, and invitation data.
  ICommunityRules public communityRules;

  /// @notice The interface of the `ResearcherPool` contract, responsible for managing
  /// and distributing token rewards to researchers.
  IResearcherPool public researcherPool;

  /// @notice The interface of the `ValidationRules` contract, which defines the rules
  /// and processes for validating or invalidating development reports.
  IValidationRules public validationRules;

  /// @notice The interface of the `VoteRules` contract, which defines rules for user voting
  /// eligibility, particularly for report validation.
  IVoteRules public voteRules;

  /// @notice The specific `UserType` enumeration value for a Researcher user.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.RESEARCHER;

  /// @notice The address of the `InspectionRules` contract.
  address private validationRulesAddress;

  /// @notice Tracks which validator has voted on which research to prevent duplicate votes.
  mapping(uint64 => mapping(address => bool)) private hasVotedOnResearch;

  // --- Constructor ---

  /**
   * @dev Initializes the ResearcherRules contract with key immutable parameters.
   * These parameters define crucial operational behaviors that cannot be changed after deployment.
   * @param timeBetweenWorks_ Minimum number of blocks that must pass between a researcher's publications (research or calculator item).
   * @param maxPenalties_ The maximum number of penalties a researcher can accumulate before block.
   * @param securityBlocksToValidation_ The period in blocks before an era ends, during which new research cannot be added.
   * This allows validators sufficient time for analysis before era finalization.
   */
  constructor(uint32 timeBetweenWorks_, uint8 maxPenalties_, uint32 securityBlocksToValidation_) {
    timeBetweenWorks = timeBetweenWorks_;
    maxPenalties = maxPenalties_;
    securityBlocksToValidation = securityBlocksToValidation_;
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract interfaces.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param contractDependency Addresses of system contracts used.
   */
  function setContractInterfaces(ContractsDependency memory contractDependency) external onlyOwner {
    communityRules = ICommunityRules(contractDependency.communityRulesAddress);
    researcherPool = IResearcherPool(contractDependency.researcherPoolAddress);
    validationRules = IValidationRules(contractDependency.validationRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _validationRulesAddress) external onlyOwner {
    validationRulesAddress = _validationRulesAddress;
  }

  // --- Public functions ---

  /**
   * @notice Allows a user to register as a researcher.
   * @dev Requires the caller to have been previously invited (handled by `CommunityRules`)
   * and for researcher vacancies to be available.
   * @param name The public name or alias of the researcher (max 50 characters).
   * @param proofPhoto A hash or identifier for the researcher's identity photo/document (max 150 characters).
   */
  function addResearcher(string memory name, string memory proofPhoto) external {
    require(bytes(name).length <= MAX_NAME_LENGTH && bytes(proofPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    require(communityRules.userTypesCount(USER_TYPE) < MAX_USER_COUNT, "Max user limit");

    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    researchers[msg.sender] = Researcher(
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

    researchersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);

    // --- Event Emission ---
    emit ResearcherRegistered(msg.sender, id, name);
  }

  /**
   * @notice Allows a registered researcher to publish a new 'research' report. A 'research' can be
   * a new calculator item, a new methodology or improvement of current ones or a generic regeneration research.
   * @dev Requires the caller to be a registered researcher, to be outside the security block window
   * (i.e., not too close to the end of an era), and to have waited the `timeBetweenWorks`
   * period since their last research publication.
   * @param title The title of the research paper (max 100 characters).
   * @param thesis A short description or thesis statement (Max characters).
   * @param file A hash or identifier for the research report file (max 150 characters).
   */
  function addResearch(string memory title, string memory thesis, string memory file) external nonReentrant {
    require(
      bytes(title).length <= MAX_TITLE_LENGTH &&
        bytes(thesis).length <= MAX_TEXT_LENGTH &&
        bytes(file).length <= MAX_HASH_LENGTH,
      "Max characters"
    );
    require(communityRules.userTypeIs(CommunityTypes.UserType.RESEARCHER, msg.sender), "Only researchers");
    require(nextEraIn() > securityBlocksToValidation, "Wait until next era");
    require(canPublishResearch(msg.sender), "Can't publish yet");

    researchesCount++;
    researchesTotalCount++;
    totalActiveLevels++;
    uint64 id = researchesTotalCount;

    researches[id] = Research(id, poolCurrentEra(), msg.sender, title, thesis, file, 0, true, 0, block.number);

    // Update researcher data
    Researcher storage researcher = researchers[msg.sender];
    researcher.publishedResearches++;
    researcher.lastPublishedAt = block.number;
    researchesIds[msg.sender].push(id);

    // Update pool level
    researcher.pool.level++;

    researcherPool.addLevel(msg.sender, 1, id);

    // --- Event Emission ---
    emit ResearchPublished(id, msg.sender, block.number);
  }

  /**
   * @notice Allows a voter to vote to invalidate a research.
   * @dev Requires the caller to be a registered voter, have sufficient level as defined by `VoteRules`,
   * and to have waited the `timeBetweenVotes` period (managed by `ValidationRules`).
   * If the validation count meets the threshold (`votesToInvalidate`), the research is marked as invalid.
   * @param id The ID of the research to validate.
   * @param justification A brief justification for invalidating the research (Max characters).
   */
  function addResearchValidation(uint64 id, string memory justification) external nonReentrant {
    // Check if user is valid.
    require(!communityRules.isDenied(msg.sender), "User denied");
    // Character limit validation for justification.
    require(bytes(justification).length <= MAX_TEXT_LENGTH, "Max characters");
    // Check if the caller is eligible to vote.
    require(voteRules.canVote(msg.sender), "Not a voter");
    // Check if the caller has waited the required time between votes.
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");
    // Check if the caller has already voted for this resource.
    require(!hasVotedOnResearch[id][msg.sender], "Already voted");
    // Check if the resource has already been penalized.
    require(!researchPenalized[id], "Penalties already applied");

    hasVotedOnResearch[id][msg.sender] = true;

    Research memory research = researches[id];

    require(research.valid && poolCurrentEra() == research.era, "Research not VALID");

    research.validationsCount += 1;
    researches[id] = research;

    uint256 votesNeeded = validationRules.votesToInvalidate();
    require(votesNeeded > 1, "Validation threshold cannot be less than 2");

    if (research.validationsCount >= votesNeeded) {
      researchPenalized[id] = true;

      _invalidateResearch(research);
      // --- Event Emission ---
      emit ResearchInvalidated(id, msg.sender, justification);

      uint256 researcherTotalPenalties = addPenalty(research.createdBy, id);

      if (researcherTotalPenalties >= maxPenalties) {
        _denyResearcher(research.createdBy);
      }
    }
    validationRules.updateValidatorLastVoteBlock(msg.sender);
    validationRules.addValidationPoint(msg.sender);

    emit ResearchValidation(msg.sender, research.id, justification);
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
  ) external {
    require(
      bytes(item).length <= MAX_ITEM_LENGTH &&
        bytes(thesis).length <= MAX_TEXT_LENGTH &&
        bytes(unit).length <= MAX_UNIT_LENGTH,
      "Max characters"
    );
    require(communityRules.userTypeIs(CommunityTypes.UserType.RESEARCHER, msg.sender), "Only researchers");
    require(canPublishCalculatorItem(msg.sender), "Can't publish yet");
    require(carbonImpact >= MIN_CARBON_IMPACT && carbonImpact <= MAX_CARBON_IMPACT, "Invalid carbon impact");

    uint64 id = calculatorItemsCount + 1;

    calculatorItems[id] = CalculatorItem(id, msg.sender, item, thesis, unit, carbonImpact, block.number);
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
  function addEvaluationMethod(string memory title, string memory research, string memory projectURL) external {
    require(
      bytes(title).length <= MAX_TITLE_LENGTH &&
        bytes(research).length <= MAX_TEXT_LENGTH &&
        bytes(projectURL).length <= MAX_HASH_LENGTH,
      "Max characters"
    );
    require(communityRules.userTypeIs(CommunityTypes.UserType.RESEARCHER, msg.sender), "Only researchers");
    require(researchers[msg.sender].canPublishMethod, "Only one method allowed");

    uint64 id = evaluationMethodsCount + 1;

    evaluationMethods[id] = EvaluationMethod(id, msg.sender, title, research, projectURL, block.number);
    evaluationMethodsCount++;
    researchers[msg.sender].canPublishMethod = false;
  }

  /**
   * @notice Allows a researcher to attempt to withdraw regeneration credit from the researcher pool.
   * @dev Requires the caller to be a registered researcher and to be eligible to withdraw tokens
   * (eligibility determined by `ResearcherPool` and includes having published at least one research in the current era).
   * Increments the researcher's `pool.currentEra` upon successful withdrawal attempt.
   */
  function withdraw() external nonReentrant {
    require(communityRules.userTypeIs(CommunityTypes.UserType.RESEARCHER, msg.sender), "Only researchers");

    Researcher storage researcher = researchers[msg.sender];
    uint256 currentEra = researcher.pool.currentEra;

    require(researcherPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    researcher.pool.currentEra++;

    researcherPool.withdraw(msg.sender, currentEra);
  }

  // --- MustBeAllowedCaller functions ---

  /**
   * @dev Allows an authorized caller to remove levels from a researcher's pool.
   * This function updates the researcher's local score and notifies the `ResearcherPool` contract.
   * @notice Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
   * this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.
   * @param addr The wallet address of the researcher from whom levels are to be removed.
   */
  function removePoolLevels(address addr) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) {
    totalActiveLevels -= researchers[addr].pool.level;

    researcherPool.removePoolLevels(addr, true);
  }

  // --- Private  functions ---

  /**
   * @dev Adds a penalty to a researcher's record when one of their researches is invalidated.
   * @notice This function must be called by the ValidationRules contract.
   * @param addr The wallet address of the researcher receiving the penalty.
   * @param researchId The ID of the research associated with this penalty.
   * @return uint256 The total number of penalties the researcher has accumulated.
   */
  function addPenalty(address addr, uint64 researchId) private returns (uint256) {
    penalties[addr].push(Penalty(researchId));

    return totalPenalties(addr);
  }

  /**
   * @dev Sets a user's to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function _denyResearcher(address userAddress) private {
    if (communityRules.isDenied(userAddress)) return; // Already denied, nothing to do

    totalActiveLevels -= researchers[userAddress].pool.level;

    communityRules.setToDenied(userAddress);

    // Inviter slashing mechanism.
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty.
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    researcherPool.removePoolLevels(userAddress, true);
  }

  /**
   * @dev Private helper function that invalidates a research by updating its status.
   * Decrements the total count of valid researches.
   * @param research The `Research` struct to be invalidated.
   */
  function _invalidateResearch(Research memory research) private {
    researchesCount--;
    research.valid = false;
    research.invalidatedAt = block.number;
    researches[research.id] = research;
    researchers[research.createdBy].pool.level -= RESOURCE_LEVEL;
    totalActiveLevels--;

    researcherPool.removePoolLevels(research.createdBy, false);
  }

  /**
   * @dev Calculates if a researcher is eligible to publish a research.
   * Eligibility based on the `lastActionBlock` and `timeBetweenWorks`.
   * @param lastActionBlock The block of last executed action.
   * @return `true` if the user can publish, `false` otherwise.
   */
  function _hasWaitedRequiredTime(uint256 lastActionBlock) private view returns (bool) {
    if (lastActionBlock == 0) {
      return true;
    }
    return block.number > lastActionBlock + timeBetweenWorks;
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

    return canInvite(totalActiveLevels, communityRules.userTypesCount(USER_TYPE), researcher.pool.level);
  }

  /**
   * @dev Checks if a researcher is eligible to publish a research.
   * @param addr The address of the potential publisher.
   * @return `true` if the user can publish research, `false` otherwise.
   */
  function canPublishResearch(address addr) public view returns (bool) {
    return _hasWaitedRequiredTime(researchers[addr].lastPublishedAt);
  }

  /**
   * @dev Checks if a researcher is eligible to publish a calculator item.
   * @param addr The address of the potential publisher.
   * @return `true` if the user can publish a calculator item, `false` otherwise.
   */
  function canPublishCalculatorItem(address addr) public view returns (bool) {
    return _hasWaitedRequiredTime(researchers[addr].lastCalculatorItemAt);
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
  function getResearch(uint64 id) public view returns (Research memory) {
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
   * @dev Current researcherPool era.
   * @return uint256 Return the current contract pool era.
   */
  function poolCurrentEra() public view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  /**
   * @dev Retrieves a specific calculator item by its ID.
   * @param id The ID of the calculator item.
   * @return The `CalculatorItem` struct containing its data.
   */
  function getCalculatorItem(uint64 id) public view returns (CalculatorItem memory) {
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
   */
  event ResearchPublished(uint256 indexed researchId, address indexed researcher, uint256 publishedAt);

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _resourceId The id of the resource receiving the vote.
   * @param _justification The justification provided for the vote.
   */
  event ResearchValidation(address indexed _validatorAddress, uint256 _resourceId, string _justification);

  /**
   * @dev Emitted when a research is successfully invalidated by validators.
   * @param researchId The ID of the research that was invalidated.
   * @param invalidatedBy The address of the voter who performed the validation action (leading to invalidation).
   * @param justification A brief justification for the invalidation.
   */
  event ResearchInvalidated(uint256 indexed researchId, address indexed invalidatedBy, string justification);
}
