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
  uint256 public activistsCount;
  ActivistPool internal activistPool;

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
    uint256 id = activistsCount + 1;
    UserType userType = UserType.ACTIVIST;
    uint256 currentEra = activistPoolEra();

    Pool memory pool = Pool(0, currentEra);

    Activist memory activist = Activist(id, msg.sender, userType, name, proofPhoto, pool);

    activists[msg.sender] = activist;
    activistsAddress.push(msg.sender);
    activistsCount++;
    userContract.addUser(msg.sender, userType);

    return activist;
  }

  /**
   * @dev Returns all registered activists
   * @return Activist struct array
   */
  function getActivists() public view returns (Activist[] memory) {
    Activist[] memory activistList = new Activist[](activistsCount);

    for (uint256 i = 0; i < activistsCount; i++) {
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
    Invitation memory producerInvitation = userContract.getInvitation(producerAddress);
    Invitation memory inspectorInvitation = userContract.getInvitation(inspectorAddress);

    uint256 minimumInspectionWonLevel = 3;

    if (
      producerInvitation.createdAtBlock > 0 &&
      producerTotalInspections == minimumInspectionWonLevel &&
      !activistWonLevel[producerInvitation.inviter][producerAddress]
    ) {
      activistWonLevel[producerInvitation.inviter][producerAddress] = true;
      setActivistLevel(producerInvitation.inviter);
    }

    if (
      inspectorInvitation.createdAtBlock > 0 &&
      inspectorTotalInspections == minimumInspectionWonLevel &&
      !activistWonLevel[inspectorInvitation.inviter][inspectorAddress]
    ) {
      activistWonLevel[inspectorInvitation.inviter][inspectorAddress] = true;
      setActivistLevel(inspectorInvitation.inviter);
    }
  }

  function withdraw() public {
    require(userContract.userTypeIs(UserType.ACTIVIST, msg.sender), "Pool only to activist");

    Activist memory activist = activists[msg.sender];
    uint256 currentEra = activist.pool.currentEra;

    require(activistPool.canApprove(currentEra), "Can't approve withdraw");

    activists[msg.sender].pool.currentEra++;

    activistPool.withdraw(msg.sender, currentEra);
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
