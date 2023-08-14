// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserContract } from "./UserContract.sol";
import { UserType } from "./types/UserTypes.sol";
import { Registrable } from "./Registrable.sol";
import { DeveloperPool } from "./DeveloperPool.sol";
import { Developer, Pool, Contribution } from "./types/DeveloperTypes.sol";

/**
 * @title DeveloperContract
 * @dev Developer resource that represent dev
 */
contract DeveloperContract is Ownable, Registrable {
  mapping(address => Developer) public developers;
  mapping(uint256 => mapping(address => Contribution)) public contributions;

  UserContract internal userContract;
  DeveloperPool internal developerPool;

  address[] internal developersAddress;
  uint256 public developersCount;

  constructor(address userContractAddress, address developerPoolAddress) {
    userContract = UserContract(userContractAddress);
    developerPool = DeveloperPool(developerPoolAddress);
  }

  /**
   * @dev Allow a new register of developer
   * @param name the name of the developer
   */
  function addDeveloper(string memory name, string memory proofPhoto) public mustBeAllowedUser uniqueDeveloper {
    UserType userType = UserType.DEVELOPER;
    uint256 poolEra = developerPoolEra();
    uint256 level = 0;

    userContract.addUser(msg.sender, userType);
    developersAddress.push(msg.sender);
    developersCount++;

    developers[msg.sender] = Developer(
      developersCount,
      msg.sender,
      userType,
      name,
      proofPhoto,
      Pool(level, poolEra),
      block.number
    );
  }

  function addContribution(string memory report) public {
    uint256 currentEra = developerPoolEra();
    Contribution memory contribution = contributions[currentEra][msg.sender];

    require(userContract.userTypeIs(UserType.DEVELOPER, msg.sender), "Only Developer");
    require(!contribution.contributed, "Already has contribution");

    updateLevel(msg.sender);

    contributions[developerPoolEra()][msg.sender] = Contribution(
      currentEra,
      developers[msg.sender].pool.level,
      report,
      true,
      block.timestamp, // solhint-disable-line not-rely-on-time
      block.number
    );
  }

  /**
   * @dev Returns all developers
   */
  function getDevelopers() public view returns (Developer[] memory) {
    Developer[] memory developerList = new Developer[](developersCount);

    for (uint256 i = 0; i < developersCount; i++) {
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
   * @dev Check if developer exists
   * @param addr The address of the developer
   */
  function developerExists(address addr) public view returns (bool) {
    return developers[addr].id > 0;
  }

  /**
   * @dev Call withdraw function from developerPool to try to claim tokens
   */
  function withdraw() public {
    require(userContract.userTypeIs(UserType.DEVELOPER, msg.sender), "Pool only to developer");

    Developer memory developer = developers[msg.sender];
    uint256 currentEra = developer.pool.currentEra;

    require(developerPool.canApprove(currentEra), "Can't approve withdraw");

    developers[msg.sender].pool.currentEra++;

    developerPool.withdraw(msg.sender, currentEra);
  }

  /**
   * @dev Allow the owner to add a new level to the developer
   * @param addr The address of the developer
   */
  function addLevel(address addr) public onlyOwner {
    updateLevel(addr);
  }

  /**
   * @dev Allow the owner to remove levels from the developer
   * @param addr The address of the developer
   */
  function removeLevel(address addr) public onlyOwner {
    Developer memory developer = developers[addr];

    require(developer.pool.level != 0, "Not enough levels to remove");

    developer.pool.level--;
    developers[addr] = developer;

    developerPool.removeLevel(addr);
  }

  function updateLevel(address addr) internal {
    Developer memory developer = developers[addr];
    developer.pool.level++;
    developers[addr] = developer;

    developerPool.addLevel(addr, developer.pool.level, 1);
  }

  /**
   * @dev Returns the current era of pool
   */
  function developerPoolEra() internal view returns (uint256) {
    return developerPool.currentContractEra();
  }

  /**
   * @dev Returns max era of pool
   */
  function eraMax() internal view returns (uint256) {
    return developerPool.eraMax();
  }

  // MODIFIERS

  modifier uniqueDeveloper() {
    require(!developerExists(msg.sender), "This developer already exist");
    _;
  }
}
