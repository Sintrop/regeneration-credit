// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Activist, Pool } from "./types/ActivistTypes.sol";
import { UserType, Invitation } from "./types/UserTypes.sol";
import { ActivistPool } from "./ActivistPool.sol";
import { Callable } from "./Callable.sol";

contract ActivistContract is Callable {
  mapping(address => Activist) internal activists;
  mapping(address => mapping(address => bool)) internal activistWonLevel;

  UserContract internal userContract;
  address[] internal activistsAddress;
  ActivistPool internal activistPool;
  UserType private constant USER_TYPE = UserType.ACTIVIST;

  uint256 private constant MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS = 3;

  constructor(address userContractAddress, address activistPoolAddress) {
    userContract = UserContract(userContractAddress);
    activistPool = ActivistPool(activistPoolAddress);
  }

  /**
   * @dev Allow a new register of activist
   * @param name the name of the activist
   * @return a Activist
   */
  function addActivist(string memory name, string memory proofPhoto) public uniqueActivist returns (Activist memory) {
    uint256 id = userContract.userTypesCount(USER_TYPE) + 1;
    uint256 currentEra = activistPoolEra();

    Pool memory pool = Pool(0, currentEra);

    Activist memory activist = Activist(id, msg.sender, USER_TYPE, name, proofPhoto, pool);

    activists[msg.sender] = activist;
    activistsAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);

    return activist;
  }

  /**
   * @dev Returns all registered activists
   * @return Activist struct array
   */
  function getActivists() public view returns (Activist[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Activist[] memory activistList = new Activist[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = activistsAddress[i];
      activistList[i] = activists[acAddress];
    }

    return activistList;
  }

  /**
   * @dev Return a specific activist
   * @param addr the address of the activist.
   */
  function getActivist(address addr) public view returns (Activist memory) {
    return activists[addr];
  }

  function setActivistLevel(address activistAddress) internal {
    if (!activistExists(activistAddress)) return;

    Activist memory activist = activists[activistAddress];
    activist.pool.level++;
    activists[activistAddress] = activist;

    activistPool.addLevel(activistAddress, 1, 1);
  }

  function addLevel(
    address producerAddress,
    uint256 producerTotalInspections,
    address inspectorAddress,
    uint256 inspectorTotalInspections
  ) external mustBeAllowedCaller {
    addLevelFromProducer(producerAddress, producerTotalInspections);
    addLevelFromInspector(inspectorAddress, inspectorTotalInspections);
  }

  function addLevelFromProducer(address producerAddress, uint256 producerTotalInspections) private {
    Invitation memory producerInvitation = userContract.getInvitation(producerAddress);

    if (
      !activistWonLevel[producerInvitation.inviter][producerAddress] &&
      producerTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[producerInvitation.inviter][producerAddress] = true;
      setActivistLevel(producerInvitation.inviter);
    }
  }

  function addLevelFromInspector(address inspectorAddress, uint256 inspectorTotalInspections) private {
    Invitation memory inspectorInvitation = userContract.getInvitation(inspectorAddress);

    if (
      !activistWonLevel[inspectorInvitation.inviter][inspectorAddress] &&
      inspectorTotalInspections >= MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
    ) {
      activistWonLevel[inspectorInvitation.inviter][inspectorAddress] = true;
      setActivistLevel(inspectorInvitation.inviter);
    }
  }

  function withdraw() public {
    require(userContract.userTypeIs(UserType.ACTIVIST, msg.sender), "Pool only to activist");

    Activist memory activist = activists[msg.sender];
    uint256 currentEra = activist.pool.currentEra;

    require(activistPool.canWithdraw(currentEra), "Can't approve withdraw");

    activists[msg.sender].pool.currentEra++;

    activistPool.withdraw(msg.sender, currentEra);
  }

  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Activist memory activist = activists[addr];

    activists[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : activist.pool.level;
    activistPool.removePoolLevels(addr, activistPoolEra(), removeSomeLevels);
  }

  /**
   * @dev Check if a specific activist exists
   * @return a bool that represent if a activist exists or not
   */
  function activistExists(address addr) public view returns (bool) {
    return bytes(activists[addr].name).length > 0;
  }

  function activistPoolEra() internal view returns (uint256) {
    return activistPool.currentContractEra();
  }

  // MODIFIERS

  modifier uniqueActivist() {
    require(!activistExists(msg.sender), "This activist already exist");
    _;
  }
}
