// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./UserContract.sol";
import "./types/DeveloperTypes.sol";
import "./Registrable.sol";
import "./DeveloperPool.sol";

/**
 * @title DeveloperContract
 * @dev Developer resource that represent dev
 */
contract DeveloperContract is Ownable, Registrable {
  mapping(address => Developer) public developers;

  UserContract internal userContract;
  DeveloperPool internal developerPool;

  address[] internal developersAddress;
  uint256 public developersCount;
  uint256[18] public totalLevelsByEra;

  constructor(address userContractAddress, address developerPoolAddress) {
    userContract = UserContract(userContractAddress);
    developerPool = DeveloperPool(developerPoolAddress);
  }

  function addDeveloper(
    string memory name,
    string memory document,
    string memory documentType,
    string memory country,
    string memory state,
    string memory city,
    string memory cep
  ) public mustBeAllowedUser uniqueDeveloper {
    UserType userType = UserType.DEVELOPER;
    uint256 poolEra = developerPoolEra();
    uint256 level = 1;

    Developer memory developer = Developer(
      developersCount + 1,
      msg.sender,
      userType,
      name,
      document,
      documentType,
      Level(level, poolEra),
      UserAddress(country, state, city, cep),
      block.number
    );

    userContract.addUser(msg.sender, userType);
    developers[msg.sender] = developer;
    developersAddress.push(msg.sender);
    developersCount++;

    incrementEraLevel(poolEra);
  }

  function getDevelopers() public view returns (Developer[] memory) {
    Developer[] memory developerList = new Developer[](developersCount);

    for (uint256 i = 0; i < developersCount; i++) {
      address devAddress = developersAddress[i];
      developerList[i] = developers[devAddress];
    }

    return developerList;
  }

  function getDeveloper(address addr) public view returns (Developer memory developer) {
    return developers[addr];
  }

  function developerExists(address addr) public view returns (bool) {
    return developers[addr].id > 0;
  }

  function approve() public requireDeveloper returns (bool) {
    Developer memory developer = developers[msg.sender];

    developerPool.approve(msg.sender, developer.level.level, developer.level.currentEra);

    developers[msg.sender].level.currentEra++;

    return true;
  }

  function addLevel(address addr) public onlyOwner {
    Developer memory developer = developers[addr];
    developer.level.level++;
    developers[addr] = developer;

    incrementEraLevel(developer.level.currentEra);
  }

  function removeLevel(address addr, uint256 levels) public onlyOwner {
    Developer memory developer = developers[addr];

    require(developer.level.level >= levels, "Invalid level to remove");

    developer.level.level -= levels;
    developers[addr] = developer;

    decrementEraLevel(developer.level.currentEra, levels);
  }

  function incrementEraLevel(uint256 fromEra) internal {
    developerPool.addLevel(fromEra);
  }

  function decrementEraLevel(uint256 fromEra, uint256 levels) internal {
    developerPool.removeLevel(fromEra, levels);
  }

  function developerPoolEra() internal view returns (uint256) {
    return developerPool.currentContractEra();
  }

  function eraMax() internal view returns (uint256) {
    return developerPool.eraMax();
  }

  // MODIFIERS

  modifier requireDeveloper() {
    require(developerExists(msg.sender), "Pool only to developer");
    _;
  }

  modifier uniqueDeveloper() {
    require(!developerExists(msg.sender), "This developer already exist");
    _;
  }
}
