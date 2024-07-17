// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { ContributorPool } from "./ContributorPool.sol";
import { Contributor, Pool, Contribution } from "./types/ContributorTypes.sol";

/**
 * @title ContributorContract
 * @dev Contributor resource that represent dev
 */
contract ContributorContract is Ownable {
  mapping(address => Contributor) public contributors;
  mapping(uint256 => mapping(address => Contribution)) public contributions;

  UserContract internal userContract;
  ContributorPool internal contributorPool;

  address[] internal contributorsAddress;
  uint256 public contributorsCount;

  constructor(address userContractAddress, address contributorPoolAddress) {
    userContract = UserContract(userContractAddress);
    contributorPool = ContributorPool(contributorPoolAddress);
  }

  /**
   * @dev Allow a new register of contributor
   * @param name the name of the contributor
   */
  function addContributor(string memory name, string memory proofPhoto) public uniqueContributor {
    UserType userType = UserType.CONTRIBUTOR;
    uint256 poolEra = contributorPoolEra();
    uint256 level = 0;

    contributors[msg.sender] = Contributor(
      contributorsCount + 1,
      msg.sender,
      userType,
      name,
      proofPhoto,
      Pool(level, poolEra),
      block.number
    );

    contributorsAddress.push(msg.sender);
    contributorsCount++;

    userContract.addUser(msg.sender, userType);
  }

  function addContribution(string memory report) public {
    uint256 currentEra = contributorPoolEra();
    Contribution memory contribution = contributions[currentEra][msg.sender];

    require(userContract.userTypeIs(UserType.CONTRIBUTOR, msg.sender), "Only Contributor");
    require(!contribution.contributed, "Already has contribution");

    contributions[contributorPoolEra()][msg.sender] = Contribution(
      currentEra,
      contributors[msg.sender].pool.level,
      report,
      true,
      block.number
    );

    updateLevel(msg.sender);
  }

  /**
   * @dev Returns all contributors
   */
  function getContributors() public view returns (Contributor[] memory) {
    Contributor[] memory contributorList = new Contributor[](contributorsCount);

    for (uint256 i = 0; i < contributorsCount; i++) {
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

  function updateLevel(address addr) internal {
    Contributor memory contributor = contributors[addr];
    contributor.pool.level++;
    contributors[addr] = contributor;

    contributorPool.addLevel(addr, contributor.pool.level, 1);
  }

  /**
   * @dev Returns the current era of pool
   */
  function contributorPoolEra() internal view returns (uint256) {
    return contributorPool.currentContractEra();
  }

  // MODIFIERS

  modifier uniqueContributor() {
    require(!contributorExists(msg.sender), "This contributor already exist");
    _;
  }
}
