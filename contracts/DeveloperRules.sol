// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CallerRules } from "./CallerRules.sol";
import { UserRules } from "./UserRules.sol";
import { UserType } from "./types/UserData.sol";
import { DeveloperPool } from "./DeveloperPool.sol";
import { ValidatorRules } from "./ValidatorRules.sol";
import { Developer, Pool, Report, Penalty } from "./types/DeveloperData.sol";

/**
 * @author Sintrop
 * @title DeveloperRules
 * @dev Manage developers rules and data
 * @notice Responsible for the development of the project
 */
contract DeveloperRules is Ownable, CallerRules {
  mapping(address => Developer) public developers;
  mapping(uint256 => mapping(address => bool)) public developerReportsEra;
  mapping(uint256 => Report) public reports;
  mapping(address => Penalty[]) public penalties;

  UserRules internal userContract;
  DeveloperPool internal developerPool;
  ValidatorRules internal validatorContract;

  address[] internal developersAddress;
  UserType private constant USER_TYPE = UserType.DEVELOPER;
  uint256 public reportsCount;

  uint256 public immutable MAX_PENALTIES;
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address userContractAddress,
    address developerPoolAddress,
    address validatorContractAddress,
    uint256 maxPenalties_,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    userContract = UserRules(userContractAddress);
    developerPool = DeveloperPool(developerPoolAddress);
    validatorContract = ValidatorRules(validatorContractAddress);
    MAX_PENALTIES = maxPenalties_;
    SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS = securityBlocksToValidatorAnalysis;
  }

  /**
   * @dev Allows a user to attempt to register as a developer
   * @param name The name of the developer
   * @param proofPhoto Identity photo
   */
  function addDeveloper(string memory name, string memory proofPhoto) public {
    uint256 level = 0;

    developers[msg.sender] = Developer(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      name,
      proofPhoto,
      Pool(level, developerPoolEra()),
      0,
      block.number
    );

    developersAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);
  }

  /**
   * @dev Allows a developer to attempt to publish a development report report
   * @notice Publish one development report per era before security blocks
   * @param description Title or description of the report
   * @param report Hash of the report file
   */
  function addReport(string memory description, string memory report) public {
    require(userContract.userTypeIs(UserType.DEVELOPER, msg.sender), "Only Developer");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add report");

    uint256 currentEra = developerPoolEra();
    bool reportEra = developerReportsEra[currentEra][msg.sender];

    require(!reportEra, "Already has report");

    developerReportsEra[currentEra][msg.sender] = true;

    reportsCount++;
    uint256 id = reportsCount;

    developers[msg.sender].totalReports++;

    reports[id] = Report(
      id,
      currentEra,
      msg.sender,
      developers[msg.sender].pool.level,
      description,
      report,
      0,
      true,
      true,
      0,
      block.number
    );

    updateLevel(msg.sender);
  }

  /**
   * @dev Allows a validator to vote to invalidate a development report
   * @notice Publish one development report per era before security blocks
   * @param id Report id
   * @param justification String with invalidation explanation
   */
  function addReportValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Report memory report = reports[id];

    require(report.valid && report.era == developerPoolEra(), "This report is not VALID");

    report.validationsCount += 1;
    reports[id] = report;

    bool mustInvalidateReport = report.validationsCount >= validatorContract.majorityValidatorsCount();

    if (mustInvalidateReport) invalidateReport(report);

    validatorContract.addDeveloperReportValidation(report, justification, msg.sender);
  }

  /**
   * @dev Executes invalidation
   * @param report Report id
   */
  function invalidateReport(Report memory report) internal {
    report.valid = false;
    report.invalidatedAt = block.number;
    reports[report.id] = report;
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
   * @dev Returns all developers
   */
  function getDevelopers() public view returns (Developer[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Developer[] memory developerList = new Developer[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address devAddress = developersAddress[i];
      developerList[i] = developers[devAddress];
    }

    return developerList;
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
    require(userContract.userTypeIs(UserType.DEVELOPER, msg.sender), "Pool only to developer");

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
    developer.pool.level++;
    developers[addr] = developer;

    developerPool.addLevel(addr, developer.pool.level, 1);
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
   * @dev Calculate blocks to next era
   * @return uint256 Return the amount of blocks to next era
   */
  function nextEraIn() public view returns (uint256) {
    return uint256(developerPool.nextEraIn(developerPoolEra()));
  }
}
