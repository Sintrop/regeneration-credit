// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Callable } from "./Callable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { DeveloperPool } from "./DeveloperPool.sol";
import { ValidatorContract } from "./ValidatorContract.sol";
import { Developer, Pool, Contribution, Penalty } from "./types/DeveloperTypes.sol";

/**
 * @author Sintrop
 * @title DeveloperContract
 * @dev Manage developers rules and data
 * @notice Responsible for the development of the project
 */
contract DeveloperContract is Ownable, Callable {
  mapping(address => Developer) public developers;
  mapping(uint256 => mapping(address => bool)) public developerContributionsEra;
  mapping(uint256 => Contribution) public contributions;
  mapping(address => Penalty[]) public penalties;

  UserContract internal userContract;
  DeveloperPool internal developerPool;
  ValidatorContract internal validatorContract;

  address[] internal developersAddress;
  UserType private constant USER_TYPE = UserType.DEVELOPER;
  uint256 public contributionsCount;

  uint256 public immutable MAX_PENALTIES;
  uint256 public immutable SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS;

  constructor(
    address userContractAddress,
    address developerPoolAddress,
    address validatorContractAddress,
    uint256 maxPenalties_,
    uint256 securityBlocksToValidatorAnalysis
  ) {
    userContract = UserContract(userContractAddress);
    developerPool = DeveloperPool(developerPoolAddress);
    validatorContract = ValidatorContract(validatorContractAddress);
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
   * @param report Hash of the report file
   */
  function addContribution(string memory report) public {
    require(userContract.userTypeIs(UserType.DEVELOPER, msg.sender), "Only Developer");
    require(nextEraIn() > SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS, "Wait until next era to add contribution");

    uint256 currentEra = developerPoolEra();
    bool contributionEra = developerContributionsEra[currentEra][msg.sender];

    require(!contributionEra, "Already has contribution");

    developerContributionsEra[currentEra][msg.sender] = true;

    contributionsCount++;
    uint256 id = contributionsCount;

    developers[msg.sender].totalContributions++;

    contributions[id] = Contribution(
      id,
      currentEra,
      msg.sender,
      developers[msg.sender].pool.level,
      report,
      0,
      true,
      true,
      0,
      block.number
    );

    updateLevel(msg.sender);
  }

  function addContributionValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Contribution memory contribution = contributions[id];

    require(contribution.valid && contribution.era == developerPoolEra(), "This contribution is not VALID");

    contribution.validationsCount += 1;
    contributions[id] = contribution;

    bool mustInvalidateContribution = contribution.validationsCount >= validatorContract.majorityValidatorsCount();

    if (mustInvalidateContribution) invalidateContribution(contribution);

    validatorContract.addDeveloperContributionValidation(contribution, justification, msg.sender);
  }

  function invalidateContribution(Contribution memory contribution) internal {
    contribution.valid = false;
    contribution.invalidatedAt = block.number;
    contributions[contribution.id] = contribution;
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
   * @dev Returns a contribution
   * @param id contributionId
   */
  function getContribution(uint256 id) public view returns (Contribution memory) {
    return contributions[id];
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

  function addPenalty(address addr, uint256 contributionId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(contributionId));

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

  function nextEraIn() public view returns (uint256) {
    return uint256(developerPool.nextEraIn(developerPoolEra()));
  }
}
