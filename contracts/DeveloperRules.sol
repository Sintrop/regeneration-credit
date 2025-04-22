// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Callable } from "./shared/Callable.sol";
import { Invitable } from "./shared/Invitable.sol";
import { VoteRules } from "./VoteRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { DeveloperPool } from "./DeveloperPool.sol";
import { ValidationRules } from "./ValidationRules.sol";
import { Developer, Pool, Report, Penalty } from "./types/DeveloperTypes.sol";

/**
 * @author Sintrop
 * @title DeveloperRules
 * @dev Manage developers rules and data
 * @notice Responsible for the development of the project
 */
contract DeveloperRules is Ownable, Callable, Invitable {
  /// @notice The relationship between address and developer data
  mapping(address => Developer) public developers;

  /// @notice The relationship between id and report data
  mapping(uint256 => Report) public reports;

  /// @notice The relationship between address and reports ids
  mapping(address => uint256[]) public reportsIds;

  /// @notice The relationship between address and penalties received
  mapping(address => Penalty[]) public penalties;

  /// @notice The relationship between id and developer address
  mapping(uint256 => address) public developersAddress;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice DeveloperPool contract address
  DeveloperPool internal developerPool;

  /// @notice ValidationRules contract address
  ValidationRules internal validationRules;

  /// @notice VoteRules contract address
  VoteRules internal voteRules;

  /// @notice Developer UserType
  UserType private constant USER_TYPE = UserType.DEVELOPER;

  /// @notice Total valid reports count
  uint256 public reportsCount;

  /// @notice Total reports count
  uint256 public reportsTotalCount;

  /// @notice Waiting blocks to publish report
  uint256 internal immutable timeBetweenWorks;

  /// @notice Max allowed penalties before user invalidation
  uint256 public immutable MAX_PENALTIES;

  /// @notice Number of blocks to block addReport before the end of an era
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address communityRulesAddress,
    address developerPoolAddress,
    address validationRulesAddress,
    uint256 timeBetweenWorks_,
    uint256 maxPenalties_,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    developerPool = DeveloperPool(developerPoolAddress);
    validationRules = ValidationRules(validationRulesAddress);
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  function setVoteRules(address votableAddress) public onlyOwner {
    voteRules = VoteRules(votableAddress);
  }

  /**
   * @dev Allows a user to attempt to register as a developer
   * @param name The name of the developer
   * @param proofPhoto Identity photo
   */
  function addDeveloper(string memory name, string memory proofPhoto) public {
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    developers[msg.sender] = Developer(
      id,
      msg.sender,
      name,
      proofPhoto,
      Pool(0, developerPoolEra()),
      0,
      block.number,
      0
    );

    developersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Checks if a developer can send invite
   * @notice True if developer can send invite
   * @param addr The developer address
   */
  function canSendInvite(address addr) public view returns (bool) {
    Developer memory developer = developers[addr];

    if (developer.id <= 0) return false;

    return canInvite(reportsTotalCount, communityRules.userTypesTotalCount(USER_TYPE), developer.pool.level);
  }

  /**
   * @dev Allows a developer to attempt to publish a development report report
   * @notice Publish one development report per era before security blocks
   * @param description Title or description of the report
   * @param report Hash of the report file
   */
  function addReport(string memory description, string memory report) public {
    require(communityRules.userTypeIs(UserType.DEVELOPER, msg.sender), "Only Developer");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add report");
    require(canPublishReport(msg.sender), "Can't publish yet");

    reportsCount++;
    reportsTotalCount++;
    uint256 id = reportsTotalCount;

    developers[msg.sender].totalReports++;

    reports[id] = Report(id, developerPoolEra(), msg.sender, description, report, 0, true, 0, block.number);

    reportsIds[msg.sender].push(id);

    updateLevel(msg.sender);
  }

  function getReportsIds(address addr) public view returns (uint256[] memory) {
    return reportsIds[addr];
  }

  /**
   * @dev Allows a validator to vote to invalidate a development report
   * @notice Publish one development report per era before security blocks
   * @param id Report id
   * @param justification String with invalidation explanation
   */
  function addReportValidation(uint256 id, string memory justification) public {
    require(voteRules.canVote(msg.sender), "User cannot vote");
    require(validationRules.waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    Report memory report = reports[id];

    require(report.valid && report.era == developerPoolEra(), "This report is not VALID");

    report.validationsCount += 1;
    reports[id] = report;

    bool mustInvalidateReport = report.validationsCount >= validationRules.votesToInvalidate();

    if (mustInvalidateReport) {
      report = invalidateReport(report);
    }

    validationRules.addDeveloperReportValidation(report, justification, msg.sender);
  }

  /**
   * @dev Executes invalidation
   * @param report Report id
   */
  function invalidateReport(Report memory report) internal returns (Report memory) {
    reportsCount--;
    report.valid = false;
    report.invalidatedAt = block.number;
    reports[report.id] = report;

    return report;
  }

  /**
   * @dev Remove pool levels from developer
   * @param addr Developer wallet
   */
  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Developer memory developer = developers[addr];

    developers[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : developer.pool.level;
    developerPool.removePoolLevels(addr, developerPoolEra(), removeSomeLevels);
  }

  /**
   * @dev Returns a developer
   * @param addr The address of the developer
   */
  function getDeveloper(address addr) public view returns (Developer memory developer) {
    return developers[addr];
  }

  /**
   * @dev Returns a report
   * @param id reportId
   */
  function getReport(uint256 id) public view returns (Report memory) {
    return reports[id];
  }

  /**
   * @dev Check if developer exists
   * @param addr The address of the developer
   */
  function developerExists(address addr) public view returns (bool) {
    return developers[addr].id > 0;
  }

  /**
   * @dev Call withdraw function from developerPool to try to claim tokens
   * @notice Withdraw regeneration credit from development service provided
   */
  function withdraw() public {
    require(communityRules.userTypeIs(UserType.DEVELOPER, msg.sender), "Pool only to developer");

    Developer memory developer = developers[msg.sender];
    uint256 currentEra = developer.pool.currentEra;

    require(developerPool.canWithdraw(currentEra), "Can't approve withdraw");

    developers[msg.sender].pool.currentEra++;

    developerPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Adds a level to a developer
   * @param addr Developer wallet
   */
  function updateLevel(address addr) internal {
    Developer memory developer = developers[addr];
    developer.lastPublishedAt = block.number;
    developer.pool.level++;
    developers[addr] = developer;

    developerPool.addLevel(addr, 1);
  }

  function addPenalty(address addr, uint256 reportId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(reportId));

    return totalPenalties(addr);
  }

  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
  }

  /**
   * @dev Current developerPool era
   * @return uint256 Return the current contract pool era
   */
  function developerPoolEra() internal view returns (uint256) {
    return developerPool.currentContractEra();
  }

  /**
   * @notice Checks if user can publish a report
   * @return bool True if can
   * @param addr Msg.sender addresss
   */
  function canPublishReport(address addr) internal view returns (bool) {
    uint256 lastPublishedAt = developers[addr].lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt == 0;
  }

  /**
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(developerPool.nextEraIn(developerPoolEra()));
  }
}
