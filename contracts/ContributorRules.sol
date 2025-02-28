// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { ContributorPool } from "./ContributorPool.sol";
import { Contributor, Pool, Contribution } from "./types/ContributorTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";

/**
 * @author Sintrop
 * @title ContributorRules
 * @dev Manage contributors rules and data
 * @notice User type to perform generic contributions to the project
 */
contract ContributorRules is Ownable, Callable, Invitable {
  /// @notice The relationship between address and contributor data
  mapping(address => Contributor) public contributors;
  mapping(uint256 => mapping(address => bool)) public contributorContributionsEra;

  /// @notice The relationship between id and contribution data
  mapping(uint256 => Contribution) public contributions;

  /// @notice The relationship between id and contributor address
  mapping(uint256 => address) public contributorsAddress;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ContributorPool contract address
  ContributorPool internal contributorPool;

  /// @notice Contributor UserType
  UserType private constant USER_TYPE = UserType.CONTRIBUTOR;

  /// @notice Total contributions count
  uint256 public contributionsCount;

  /// @notice Number of blocks to block addContribution before the end of an era
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address communityRulesAddress,
    address contributorPoolAddress,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    contributorPool = ContributorPool(contributorPoolAddress);
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  /**
   * @dev Allows a user to attempt to register as a contributor
   * @param name The name of the contributor
   * @param proofPhoto Identity photo
   */
  function addContributor(string memory name, string memory proofPhoto) public {
    uint256 level = 0;
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    contributors[msg.sender] = Contributor(
      id,
      msg.sender,
      name,
      proofPhoto,
      Pool(level, contributorPoolEra()),
      block.number
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

    return canInvite(contributionsCount, communityRules.userTypesTotalCount(USER_TYPE), contributor.pool.level);
  }

  /**
   * @dev Allows a contributor to attempt to publish a contribution report
   * @notice Publish one contribution per era before security blocks
   * @param report Hash of the report file
   */
  function addContribution(string memory report) public {
    require(communityRules.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Only Contributor");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add contribution");

    uint256 currentEra = contributorPoolEra();

    bool contributionEra = contributorContributionsEra[currentEra][msg.sender];
    require(!contributionEra, "Already has contribution");

    contributorContributionsEra[currentEra][msg.sender] = true;

    contributionsCount++;
    uint256 id = contributionsCount;

    contributions[id] = Contribution(
      id,
      currentEra,
      msg.sender,
      contributors[msg.sender].pool.level,
      report,
      block.number
    );

    addPoolLevel(msg.sender);
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
   * @dev Current contributorPool era
   * @return uint256 Return the current contract pool era
   */
  function contributorPoolEra() internal view returns (uint256) {
    return contributorPool.currentContractEra();
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(contributorPool.nextEraIn(contributorPoolEra()));
  }
}
