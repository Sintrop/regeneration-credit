// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IRegeneratorRules } from "./interfaces/IRegeneratorRules.sol";
import { IInspectorRules } from "./interfaces/IInspectorRules.sol";
import { IDeveloperRules } from "./interfaces/IDeveloperRules.sol";
import { IResearcherRules } from "./interfaces/IResearcherRules.sol";
import { IContributorRules } from "./interfaces/IContributorRules.sol";
import { IActivistRules } from "./interfaces/IActivistRules.sol";
import { IVoteRules } from "./interfaces/IVoteRules.sol";
import { IValidationPool } from "./interfaces/IValidationPool.sol";
import { Regenerator } from "./types/RegeneratorTypes.sol";
import { ContractsDependency, Pool } from "./types/ValidationTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ValidationRules
 * @author Sintrop
 * @dev Manage validators rules and data. This contract is responsible for reviewing and voting to invalidate wrong or corrupted actions across different user types and resources.
 * @notice Responsible for reviewing and voting to invalidate users and resources.
 */
contract ValidationRules is Callable, ReentrancyGuard {
  // --- Constants ---

  /// @notice Number of inspections required for a Regenerator to achieve validation immunity.
  uint8 private constant REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD = 6;

  /// @notice Max character length for the justification provided in a validation vote.
  uint16 private constant MAX_JUSTIFICATION_LENGTH = 300;

  /// @notice Voter thresholds to invalidate a resource/user.
  uint32 private constant VOTERS_THRESHOLD_LEVEL_1 = 12;
  uint32 private constant VOTERS_THRESHOLD_LEVEL_2 = 167;

  /// @notice Votes thresholds to invalidate a resource/user.
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_1 = 2;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_2 = 5;
  uint32 private constant VOTES_TO_INVALIDATE_LEVEL_3 = 360;

  uint256 private constant DYNAMIC_INVALIDATION_PERCENTAGE = 3;

  /// @notice Validation points required for one pool level.
  uint256 public constant POINTS_PER_LEVEL = 50;

  // --- State variables ---

  /// @notice The relationship between address and validations received by era.
  mapping(address => mapping(uint256 => uint256)) public userValidations;

  /// @notice Relationship between validator and user validation. Only one validation per user per era allowed.
  mapping(address => mapping(address => mapping(uint256 => bool))) private validatorUsersValidations;

  /// @notice Relationship between validator and last vote block.number.
  mapping(address => uint256) public validatorLastVoteAt;

  /// @notice Tracks the first user who voted to invalidate a specific user in a given era.
  mapping(address => mapping(uint256 => address)) public hunterVoter;

  /// @notice Mapping from a validators's address directly to their pool data.
  mapping(address => Pool) public hunterPools;

  /// @notice Tracks the accumulated, unspent validation points for each voter.
  mapping(address => uint256) public validationPoints;

  /// @notice Tracks the total number of validation levels a user has ever earned.
  mapping(address => uint256) public totalValidationLevels;

  /// @notice CommunityRules contract interface.
  ICommunityRules public communityRules;

  /// @notice RegeneratorRules contract interface.
  IRegeneratorRules public regeneratorRules;

  /// @notice InspectorRules contract interface.
  IInspectorRules public inspectorRules;

  /// @notice DeveloperRules contract interface.
  IDeveloperRules public developerRules;

  /// @notice ResearcherRules contract interface.
  IResearcherRules public researcherRules;

  /// @notice ContributorRules contract interface.
  IContributorRules public contributorRules;

  /// @notice ActivistRules contract interface.
  IActivistRules public activistRules;

  /// @notice VoteRules contract interface.
  IVoteRules public voteRules;

  /// @notice The interface of the `ValidationPool` contract, responsible for managing
  /// and distributing token rewards to validators.
  IValidationPool public validationPool;

  /// @notice Amount of blocks between votes.
  uint256 public immutable timeBetweenVotes;

  // --- Constructor ---

  /**
   * @notice Initializes the ValidationRules contract with a minimum time between votes.
   * @dev Sets the immutable `timeBetweenVotes` which dictates how many blocks a validator must wait between votes.
   * @param timeBetweenVotes_ The number of blocks a validator must wait between consecutive votes.
   */
  constructor(uint256 timeBetweenVotes_) {
    timeBetweenVotes = timeBetweenVotes_;
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract interfaces.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param contractDependency Addresses of system contracts used.
   */
  function setContractInterfaces(ContractsDependency memory contractDependency) external onlyOwner {
    communityRules = ICommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = IRegeneratorRules(contractDependency.regeneratorRulesAddress);
    inspectorRules = IInspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = IDeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = IResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = IContributorRules(contractDependency.contributorRulesAddress);
    activistRules = IActivistRules(contractDependency.activistRulesAddress);
    voteRules = IVoteRules(contractDependency.voteRulesAddress);
    validationPool = IValidationPool(contractDependency.validationPoolAddress);
  }

  // --- External Functions (State Modifying) ---

  /**
   * @notice Allows users to attempt to vote to invalidate an user.
   * @dev Votes to invalidate users with unwanted behavior.
   *
   * Requirements:
   * - The caller must be a registered voter user (verified by VoteRules).
   * - Caller level must be above average (verified by VoteRules.canVote implicitly).
   * - Caller must have waited `timeBetweenVotes` since their last vote.
   * - Caller must vote only once per user per era.
   * - The target user must be registered and not already denied.
   * - If the target user is a Regenerator, they must have fewer than 4 completed inspections to be eligible for invalidation.
   *
   * @param userAddress Invalidation user address.
   * @param justification Invalidation justification (Max characters).
   */
  function addUserValidation(address userAddress, string memory justification) external nonReentrant {
    require(bytes(justification).length <= MAX_JUSTIFICATION_LENGTH, "Max characters");
    require(voteRules.canVote(msg.sender), "Not a voter");
    require(!communityRules.userTypeIs(CommunityTypes.UserType.UNDEFINED, userAddress), "User not registered");
    require(
      !communityRules.userTypeIs(CommunityTypes.UserType.SUPPORTER, userAddress),
      "Supporter validation not allowed"
    );
    require(!communityRules.isDenied(userAddress), "User already denied");
    require(_canBeValidated(userAddress), "Regenerator has reached validation immunity");

    uint256 currentEra = _userCurrentEra(userAddress);

    require(!validatorUsersValidations[msg.sender][userAddress][currentEra], "Already voted");
    require(waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    if (hunterPools[msg.sender].currentEra == 0) {
      hunterPools[msg.sender].currentEra = validationPool.currentContractEra();
    }

    if (userValidations[userAddress][currentEra] == 0) {
      hunterVoter[userAddress][currentEra] = msg.sender;
    }

    validatorUsersValidations[msg.sender][userAddress][currentEra] = true;
    validatorLastVoteAt[msg.sender] = block.number;
    userValidations[userAddress][currentEra]++;
    validationPoints[msg.sender]++;

    uint256 validationsCount = userValidations[userAddress][currentEra];
    uint256 _votesToInvalidate = votesToInvalidate();

    if (validationsCount >= _votesToInvalidate) {
      _denyUser(userAddress);
      address hunter = hunterVoter[userAddress][currentEra];
      totalValidationLevels[hunter]++;
      validationPool.addLevel(hunter, userAddress);
    }

    emit UserValidation(msg.sender, userAddress, justification, currentEra);
  }

  /**
   * @notice Allows a voter to exchange their accumulated validation points for a single level.
   * @dev This function implements a fixed exchange rate where a voter can trade a specific
   * amount of points (POINTS_PER_LEVEL) for one level, which contributes to their
   * standing and potential rewards in the Validation Pool.
   *
   * Requirements:
   * - The caller (`msg.sender`) must be a registered voter (e.g., Researcher, Developer, Contributor).
   * - The caller must have accumulated at least `POINTS_PER_LEVEL` points to be eligible for the exchange.
   */
  function exchangePointsForLevel() external nonReentrant {
    require(communityRules.isVoter(msg.sender), "Pool only to voters");

    uint256 userPoints = validationPoints[msg.sender];
    require(userPoints >= POINTS_PER_LEVEL, "Not enough points");

    if (hunterPools[msg.sender].currentEra == 0) {
      hunterPools[msg.sender].currentEra = validationPool.currentContractEra();
    }

    validationPoints[msg.sender] = userPoints - POINTS_PER_LEVEL;
    totalValidationLevels[msg.sender]++;

    validationPool.addPointsLevel(msg.sender);
  }

  /**
   * @dev Allows a validator to initiate a withdrawal of Regeneration Credits
   * for the malicious/fake users hunt service. Rewards will be based on their hunting level and current era.
   * @notice Validators can claim tokens for their hunt and investigation service.
   */
  function withdraw() external nonReentrant {
    // Only registered voters can call this function.
    require(communityRules.isVoter(msg.sender), "Pool only to voters");
    require(validatorLastVoteAt[msg.sender] > 0, "Not eligible to withdraw");

    Pool storage hunterPool = hunterPools[msg.sender];
    uint256 currentEra = hunterPool.currentEra;

    // Check if the validator is eligible to withdraw for the current era through ValidationPool.
    require(validationPool.canWithdraw(currentEra), "Not eligible to withdraw for this era");

    // Increment the validator's era in their local pool data.
    hunterPool.currentEra++;

    // Call the ValidationPool contract to perform the actual token withdrawal.
    validationPool.withdraw(msg.sender, currentEra);
  }

  // --- MustBeAllowedCaller functions ---

  /**
   * @notice Called only by authorized callers.
   * @dev Update last validator vote block.number.
   * @param validatorAddress The validator wallet address.
   */
  function updateValidatorLastVoteBlock(address validatorAddress) external mustBeAllowedCaller {
    validatorLastVoteAt[validatorAddress] = block.number;
  }

  /**
   * @notice Grants a single validation point to a voter for a voting action.
   * @dev This is a function intended to be called by the resources contract after a validation vote.
   * @param voter The address of the voter who is earning the point.
   */
  function addValidationPoint(address voter) external mustBeAllowedCaller {
    validationPoints[voter]++;
  }

  // --- Private Functions ---

  /**
   * @dev Determines the current era for a given user's type.
   * @param userAddress The address of the user.
   * @return era The current era for the user's specific type pool.
   */
  function _userCurrentEra(address userAddress) private view returns (uint256 era) {
    CommunityTypes.UserType userType = communityRules.getUser(userAddress);

    if (userType == CommunityTypes.UserType.ACTIVIST) return activistRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) return contributorRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.DEVELOPER) return developerRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.INSPECTOR) return inspectorRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.RESEARCHER) return researcherRules.poolCurrentEra();
    if (userType == CommunityTypes.UserType.REGENERATOR) return regeneratorRules.poolCurrentEra();
  }

  /**
   * @dev Sets a user's type to DENIED in CommunityRules and removes their levels from pools.
   * @param userAddress The address of the user to deny.
   */
  function _denyUser(address userAddress) private {
    CommunityTypes.UserType userType = communityRules.getUser(userAddress);

    if (communityRules.isDenied(userAddress)) return; // Already denied, nothing to do

    communityRules.setToDenied(userAddress);

    // Inviter slashing mechanism.
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(userAddress);
    // If invited, add invitation penalty.
    if (invitation.inviter != address(0)) {
      communityRules.addInviterPenalty(invitation.inviter);
    }

    // Check for each user type and call their respective removePoolLevels function.
    if (userType == CommunityTypes.UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress);
    if (userType == CommunityTypes.UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, true);
    if (userType == CommunityTypes.UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress);
    if (userType == CommunityTypes.UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress);
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress);
    if (userType == CommunityTypes.UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress);
  }

  /**
   * @dev Checks if a regenerator has reached validation imunity.
   * @dev The process to achieve immunity will take six inspections, enough time to check
   * and ensure the user is in compliance. After this time, the user concludes the certification process and is granted immunity.
   * @param addr The address of the regenerator.
   * @return bool True if user has reached validation imunity, false otherwise.
   */
  function _canBeValidated(address addr) private view returns (bool) {
    if (!communityRules.userTypeIs(CommunityTypes.UserType.REGENERATOR, addr)) return true;

    Regenerator memory regenerator = regeneratorRules.getRegenerator(addr);

    return regenerator.totalInspections < REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD;
  }

  // --- View Functions ---

  /**
   * @notice Get user validations count for a specific user in a given era.
   * @dev Retrieves the total number of validation votes received for a specified user and era.
   * @param userAddress The address of the user.
   * @param currentEra The era to check for validations.
   * @return uint256 The number of received invalidation votes.
   */
  function getUserValidations(address userAddress, uint256 currentEra) public view returns (uint256) {
    return userValidations[userAddress][currentEra];
  }

  /**
   * @notice Get how many validations is necessary to invalidate a user or resource.
   * @dev Calculates the required number of votes for invalidation based on the total number of registered voters in the system.
   * Calculation is based on the `votersCount` which includes researchers, developers, and contributors.
   * @return count Number of votes required for invalidation.
   */
  function votesToInvalidate() public view returns (uint256) {
    uint256 voters = communityRules.votersCount();
    // Threshold 1: Very early stage, requires a fixed number of 2 votes.
    if (voters < VOTERS_THRESHOLD_LEVEL_1) {
      return VOTES_TO_INVALIDATE_LEVEL_1;
    }
    // Threshold 2: Early stage, requires a fixed number of 5 votes.
    if (voters < VOTERS_THRESHOLD_LEVEL_2) {
      return VOTES_TO_INVALIDATE_LEVEL_2;
    }

    // Threshold 3: Mature stage, calculates votes based on a percentage of active voters.
    uint256 invalidationVotes = (voters * DYNAMIC_INVALIDATION_PERCENTAGE) / 100;
    uint256 requiredVotes = invalidationVotes + 1;

    // Threshold 4: Capped stage, returns a maximum votes level.
    if (requiredVotes > VOTES_TO_INVALIDATE_LEVEL_3) {
      return VOTES_TO_INVALIDATE_LEVEL_3;
    }

    return requiredVotes;
  }

  /**
   * @notice Check if a validator can vote based on their last vote block number and `timeBetweenVotes`.
   * @dev Returns true if the current block number is past `validatorLastVoteAt` + `timeBetweenVotes`,
   * or if the validator has never voted before.
   * @param validatorAddress The address of the validator.
   * @return bool True if the validator can vote, false otherwise.
   */
  function waitedTimeBetweenVotes(address validatorAddress) public view returns (bool) {
    uint256 lastVoteAt = validatorLastVoteAt[validatorAddress];

    bool canVote = block.number > lastVoteAt + timeBetweenVotes;
    return canVote || lastVoteAt == 0;
  }

  // --- Events ---

  /**
   * @notice Emitted
   * @param _validatorAddress The address of the validator.
   * @param _userAddress The wallet of the user receiving the vote.
   * @param _justification The justification provided for the vote.
   * @param _currentEra User validation currentEra.
   */
  event UserValidation(
    address indexed _validatorAddress,
    address indexed _userAddress,
    string _justification,
    uint256 indexed _currentEra
  );
}
