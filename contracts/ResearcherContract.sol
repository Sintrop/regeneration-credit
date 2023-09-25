// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { Researcher, Work, Pool } from "./types/ResearcherTypes.sol";
import { Registrable } from "./Registrable.sol";
import { UserType } from "./types/UserTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";

contract ResearcherContract is Registrable {
  mapping(address => Researcher) internal researchers;
  mapping(uint256 => Work) internal works;

  UserContract internal userContract;
  ResearcherPool internal researcherPool;
  address[] internal researchersAddress;
  uint256 public researchersCount;
  uint256 public worksCount;

  constructor(address userContractAddress, address researcherPoolAddress) {
    userContract = UserContract(userContractAddress);
    researcherPool = ResearcherPool(researcherPoolAddress);
  }

  /**
   * @dev Allow a new register of researcher
   * @param name the name of the researcher
   * @return a Researcher
   */
  function addResearcher(
    string memory name,
    string memory proofPhoto
  ) public uniqueResearcher mustBeAllowedUser returns (Researcher memory) {
    uint256 id = researchersCount + 1;
    UserType userType = UserType.RESEARCHER;
    uint256 currentEra = researcherPoolEra();

    Pool memory pool = Pool(0, currentEra);

    Researcher memory researcher = Researcher(id, msg.sender, userType, name, pool, proofPhoto, 0);

    researchers[msg.sender] = researcher;
    researchersAddress.push(msg.sender);
    researchersCount++;
    userContract.addUser(msg.sender, userType);

    return researcher;
  }

  /**
   * @dev Returns all registered researchers
   * @return Researcher struct array
   */
  function getResearchers() public view returns (Researcher[] memory) {
    Researcher[] memory researcherList = new Researcher[](researchersCount);

    for (uint256 i = 0; i < researchersCount; i++) {
      address acAddress = researchersAddress[i];
      researcherList[i] = researchers[acAddress];
    }

    return researcherList;
  }

  /**
   * @dev Return a specific researcher
   * @param addr the address of the researcher.
   */
  function getResearcher(address addr) public view returns (Researcher memory) {
    return researchers[addr];
  }

  /**
   * @dev Check if a specific researcher exists
   * @return a bool that represent if a researcher exists or not
   */
  function researcherExists(address addr) public view returns (bool) {
    return bytes(researchers[addr].name).length > 0;
  }

  function addWork(string memory title, string memory thesis, string memory file) public {
    require(userContract.userTypeIs(UserType.RESEARCHER, msg.sender), "Only allowed to researchers");

    Researcher storage researcher = researchers[msg.sender];
    researcher.pool.level++;
    researchers[msg.sender] = researcher;

    researcherPool.addLevel(msg.sender, researcher.pool.level, 1);

    uint256 id = worksCount + 1;

    Work memory work = Work(id, msg.sender, title, thesis, file, block.timestamp); // solhint-disable-line

    works[id] = work;
    worksCount++;
    researchers[msg.sender].publishedWorks++;
  }

  function getWorks() public view returns (Work[] memory) {
    Work[] memory worksList = new Work[](worksCount);
    uint256 count = worksCount;

    for (uint256 i = 0; i < count; i++) {
      worksList[i] = works[i + 1];
    }

    return worksList;
  }

  function withdraw() public {
    require(userContract.userTypeIs(UserType.RESEARCHER, msg.sender), "Pool only to researchers");

    Researcher memory researcher = researchers[msg.sender];
    uint256 currentEra = researcher.pool.currentEra;

    require(researcherPool.canApprove(currentEra), "Can't approve withdraw");

    researchers[msg.sender].pool.currentEra++;

    researcherPool.withdraw(msg.sender, currentEra);
  }

  function researcherPoolEra() internal view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  // MODIFIERS

  modifier uniqueResearcher() {
    require(!researcherExists(msg.sender), "This researcher already exist");
    _;
  }
}
