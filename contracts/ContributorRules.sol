// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ContributorPool } from "./ContributorPool.sol";
import { Contributor, Pool, Contribution, Penalty, ContractsDependency } from "./types/ContributorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";
import { VoteRules } from "./VoteRules.sol";
import { ValidationRules } from "./ValidationRules.sol";

/**
 * @author Sintrop
 * @title ContributorRules
 * @dev Manage contributors rules and data
 * @notice User type to perform generic contributions to the project
 */
contract ContributorRules is Ownable, Callable, Invitable {
  /// @notice The relationship between address and contributor data
  mapping(address => Contributor) public contributors;

  /// @notice The relationship between id and contribution data
  mapping(uint256 => Contribution) public contributions;

  /// @notice The relationship between id and contributor address
  mapping(uint256 => address) public contributorsAddress;

  /// @notice The relationship between address and contributions ids
  mapping(address => uint256[]) public contributionsIds;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ContributorPool contract address
  ContributorPool internal contributorPool;

  /// @notice ValidationRules contract address
  ValidationRules internal validationRules;

  /// @notice VoteRules contract address
  VoteRules internal voteRules;

  /// @notice Contributor UserType
  UserType private constant USER_TYPE = UserType.CONTRIBUTOR;

  /// @notice Total valid contributions count
  uint256 public contributionsCount;

  /// @notice Total contributions count
  uint256 public contributionsTotalCount;

  /// @notice Waiting blocks to publish contribution
  uint256 internal immutable timeBetweenWorks;

  /// @notice Number of blocks to block addContribution before the end of an era
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  /// @notice Max allowed penalties before user invalidation
  uint256 public immutable MAX_PENALTIES;

  /// @notice The relationship between address and penalties received
  mapping(address => Penalty[]) public penalties;

  constructor(uint256 timeBetweenWorks_, uint256 maxPenalties_, uint256 securityBlocksToValidatorAnalysis) {
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    contributorPool = ContributorPool(contractDependency.contributorPoolAddress);
    validationRules = ValidationRules(contractDependency.validationRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a contributor
   *
   * Requirements:
   *
   * - the caller must have been invited before
   * - vacancies according to the number of regenerators
   *
   * @param name The name of the contributor
   * @param proofPhoto Identity photo
   */
  function addContributor(string memory name, string memory proofPhoto) public {
    require(communityRules.userTypesCount(USER_TYPE) <= 16000, "Max limit reached");

    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    contributors[msg.sender] = Contributor(
      id,
      msg.sender,
      name,
      proofPhoto,
      Pool(0, contributorPoolEra()),
      block.number,
      0
    );

    contributorsAddress[id] = msg.sender;

    communityRules.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Checks if a contributor can send invite
   * @notice True if contributor can send invite
   * @param addr The contributor address
   */
  function canSendInvite(address addr) public view returns (bool) {
    Contributor memory contributor = contributors[addr];

    if (contributor.id <= 0) return false;

    return canInvite(contributionsTotalCount, communityRules.userTypesTotalCount(USER_TYPE), contributor.pool.level);
  }

  /**
   * @dev Allows a contributor to attempt to publish a contribution report
   * @notice Publish contributions before security blocks and after timeBetweenWorks
   * @param description Title or description of the contribution
   * @param report Hash of the report file
   */
  function addContribution(string memory description, string memory report) public {
    require(communityRules.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Only Contributor");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add contribution");
    require(canPublishContribution(msg.sender), "Can't publish yet");

    contributionsCount++;
    contributionsTotalCount++;
    uint256 id = contributionsTotalCount;

    contributions[id] = Contribution(
      id,
      contributorPoolEra(),
      msg.sender,
      description,
      report,
      0,
      true,
      0,
      block.number
    );

    contributionsIds[msg.sender].push(id);

    addPoolLevel(msg.sender);
  }

  /**
   * @dev Returns an array of ids of the contributions made by the addr
   * @notice Get the contribution id of an user
   * @param addr Checked address
   */
  function getContributionsIds(address addr) public view returns (uint256[] memory) {
    return contributionsIds[addr];
  }

  /**
   * @dev Allows a validator to vote to invalidate a contribution
   * @notice Publish contributions before security blocks
   * @param id Contribution id
   * @param justification String with invalidation explanation
   */
  function addContributionValidation(uint256 id, string memory justification) public {
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    Contribution memory contribution = contributions[id];

    require(contribution.valid && contribution.era == contributorPoolEra(), "This contribution is not VALID");

    contribution.validationsCount += 1;
    contributions[id] = contribution;

    bool mustInvalidateContribution = contribution.validationsCount >= validationRules.votesToInvalidate();

    if (mustInvalidateContribution) {
      contribution = invalidateContribution(contribution);
    }

    validationRules.addContributionValidation(contribution, justification, msg.sender);
  }

  /**
   * @dev Executes invalidation
   * @param contribution Contribution id
   */
  function invalidateContribution(Contribution memory contribution) internal returns (Contribution memory) {
    contributionsCount--;
    contribution.valid = false;
    contribution.invalidatedAt = block.number;
    contributions[contribution.id] = contribution;

    return contribution;
  }

  /**
   * @dev Returns a contributor
   * @param addr The address of the contributor
   */
  function getContributor(address addr) public view returns (Contributor memory contributor) {
    return contributors[addr];
  }

  /**
   * @dev Returns a contribution
   * @param id contributionId
   */
  function getContribution(uint256 id) public view returns (Contribution memory) {
    return contributions[id];
  }

  /**
   * @dev Check if contributor exists
   * @param addr The address of the contributor
   */
  function contributorExists(address addr) public view returns (bool) {
    return contributors[addr].id > 0;
  }

  /**
   * @dev Call withdraw function from contributorPool to try to claim tokens
   * @notice Withdraw regeneration credit from contribution service provided
   *
   * Requirements:
   *
   * - only to contributors
   * - to be eligible to withdraw tokens, you must have published at least one contribution in the era
   *
   */
  function withdraw() public {
    require(communityRules.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Pool only to contributor");

    Contributor memory contributor = contributors[msg.sender];
    uint256 currentEra = contributor.pool.currentEra;

    require(contributorPool.canWithdraw(currentEra), "Can't approve withdraw");

    contributors[msg.sender].pool.currentEra++;

    contributorPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Adds a level to a contributor
   * @param addr Contributor wallet
   */
  function addPoolLevel(address addr) internal {
    Contributor memory contributor = contributors[addr];
    contributor.lastPublishedAt = block.number;
    contributor.pool.level++;
    contributors[addr] = contributor;

    contributorPool.addLevel(addr, 1);
  }

  /**
   * @dev Remove pool levels from contributor
   * @param addr Contributor wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Contributor memory contributor = contributors[addr];

    contributorPool.removePoolLevels(addr, contributor.pool.currentEra, removeSomeLevels);
  }

  /**
   * @dev Add contributor penalty when invalidating a contribution
   * @param addr Contributor wallet
   * @param contributionId Contribution id
   */
  function addPenalty(address addr, uint256 contributionId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(contributionId));

    return totalPenalties(addr);
  }

  /**
   * @dev Returns addr number of penalties
   * @notice Number of penalties of an user
   * @param addr Contributor wallet
   */
  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Current contributorPool era
   * @return uint256 Return the current contract pool era
   */
  function contributorPoolEra() internal view returns (uint256) {
    return contributorPool.currentContractEra();
  }

  /**
   * @dev Checks if user can publish a contribution
   * @return bool True if can
   * @param addr Msg.sender addresss
   */
  function canPublishContribution(address addr) internal view returns (bool) {
    uint256 lastPublishedAt = contributors[addr].lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(contributorPool.nextEraIn(contributorPoolEra()));
  }
}
