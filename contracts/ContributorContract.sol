// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { ContributorPool } from "./ContributorPool.sol";
import { Contributor, Pool, Contribution } from "./types/ContributorTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @title ContributorContract
 * @dev Contributor resource that represent dev
 */
contract ContributorContract is Ownable, Callable {
  mapping(address => Contributor) public contributors;
  mapping(uint256 => mapping(address => bool)) public researcherContributionsEra;
  mapping(uint256 => Contribution) public contributions;

  UserContract internal userContract;
  ContributorPool internal contributorPool;

  address[] internal contributorsAddress;
  UserType private constant USER_TYPE = UserType.CONTRIBUTOR;
  uint256 public contributionsCount;

  constructor(address userContractAddress, address contributorPoolAddress) {
    userContract = UserContract(userContractAddress);
    contributorPool = ContributorPool(contributorPoolAddress);
  }

  /**
   * @dev Allow a new register of contributor
   * @param name the name of the contributor
   */
  function addContributor(string memory name, string memory proofPhoto) public {
    uint256 level = 0;

    contributors[msg.sender] = Contributor(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      name,
      proofPhoto,
      Pool(level, contributorPoolEra()),
      block.number
    );

    contributorsAddress.push(msg.sender);

    userContract.addUser(msg.sender, USER_TYPE);
  }

  function addContribution(string memory report) public {
    require(userContract.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Only Contributor");

    uint256 currentEra = contributorPoolEra();

    bool contributionEra = researcherContributionsEra[currentEra][msg.sender];
    require(!contributionEra, "Already has contribution");

    researcherContributionsEra[currentEra][msg.sender] = true;

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
   * @dev Returns all contributors
   */
  function getContributors() public view returns (Contributor[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Contributor[] memory contributorList = new Contributor[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address devAddress = contributorsAddress[i];
      contributorList[i] = contributors[devAddress];
    }

    return contributorList;
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
   */
  function withdraw() public {
    require(userContract.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Pool only to contributor");

    Contributor memory contributor = contributors[msg.sender];
    uint256 currentEra = contributor.pool.currentEra;

    require(contributorPool.canWithdraw(currentEra), "Can't approve withdraw");

    contributors[msg.sender].pool.currentEra++;

    contributorPool.withdraw(msg.sender, currentEra);
  }

  function addPoolLevel(address addr) internal {
    Contributor memory contributor = contributors[addr];
    contributor.pool.level++;
    contributors[addr] = contributor;

    contributorPool.addLevel(addr, contributor.pool.level, 1);
  }

  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Contributor memory contributor = contributors[addr];

    contributorPool.removePoolLevels(addr, contributor.pool.currentEra, removeSomeLevels);
  }

  /**
   * @dev Returns the current era of pool
   */
  function contributorPoolEra() internal view returns (uint256) {
    return contributorPool.currentContractEra();
  }
}
