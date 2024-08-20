// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./Callable.sol";
import { UserContract } from "./UserContract.sol";
import { Researcher, Work, Pool, Penalty } from "./types/ResearcherTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { ResearcherPool } from "./ResearcherPool.sol";
import { ValidatorContract } from "./ValidatorContract.sol";

contract ResearcherContract is Callable {
  mapping(address => Researcher) internal researchers;
  mapping(uint256 => Work) public works;
  mapping(address => Penalty[]) public penalties;

  UserContract internal userContract;
  ResearcherPool internal researcherPool;
  ValidatorContract internal validatorContract;

  address[] internal researchersAddress;
  UserType private constant USER_TYPE = UserType.RESEARCHER;
  uint256 public worksCount;
  uint256 internal immutable timeBetweenWorks;

  uint256 public immutable MAX_PENALTIES;

  constructor(
    address userContractAddress,
    address researcherPoolAddress,
    address validatorContractAddress,
    uint256 timeBetweenWorks_,
    uint256 maxPenalties_
  ) {
    userContract = UserContract(userContractAddress);
    researcherPool = ResearcherPool(researcherPoolAddress);
    validatorContract = ValidatorContract(validatorContractAddress);
    timeBetweenWorks = timeBetweenWorks_;
    MAX_PENALTIES = maxPenalties_;
  }

  /**
   * @dev Allow a new register of researcher
   * @param name the name of the researcher
   * @return a Researcher
   */
  function addResearcher(
    string memory name,
    string memory proofPhoto
  ) public returns (Researcher memory) {
    require(!researcherExists(msg.sender), "This researcher already exist");

    Pool memory pool = Pool(0, researcherPoolEra());

    Researcher memory researcher = Researcher(
      userContract.userTypesCount(USER_TYPE) + 1,
      msg.sender,
      USER_TYPE,
      name,
      pool,
      proofPhoto,
      0,
      0
    );

    researchers[msg.sender] = researcher;
    researchersAddress.push(msg.sender);
    userContract.addUser(msg.sender, USER_TYPE);

    return researcher;
  }

  /**
   * @dev Returns all registered researchers
   * @return Researcher struct array
   */
  function getResearchers() public view returns (Researcher[] memory) {
    uint256 usersCount = userContract.userTypesCount(USER_TYPE);
    Researcher[] memory researcherList = new Researcher[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
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
    require(canPublishWork(msg.sender), "Can't publish yet");

    Researcher storage researcher = researchers[msg.sender];
    researcher.pool.level++;
    researchers[msg.sender] = researcher;

    uint256 id = worksCount + 1;

    Work memory work = Work(id, researcherPoolEra(), msg.sender, title, thesis, file, 0, true, 0, block.timestamp); // solhint-disable-line

    works[id] = work;
    worksCount++;
    researchers[msg.sender].publishedWorks++;
    researchers[msg.sender].lastPublishedAt = block.number;

    researcherPool.addLevel(msg.sender, 1, 1);
  }

  function addWorkValidation(uint256 id, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "Please register as validator");

    Work memory work = works[id];

    require(work.valid && work.era == researcherPoolEra(), "This work is not VALID");

    work.validationsCount += 1;
    works[id] = work;

    bool mustInvalidateWork = work.validationsCount >= validatorContract.majorityValidatorsCount();

    if (mustInvalidateWork) invalidateWork(work);

    validatorContract.addResearcheWorkValidation(work, justification, msg.sender);
  }

  function invalidateWork(Work memory work) internal {
    work.valid = false;
    work.invalidatedAt = block.number;
    works[work.id] = work;
  }

  function removePoolLevels(address addr, uint256 removeSomeLevels) public mustBeAllowedCaller {
    Researcher memory researcher = researchers[addr];

    researchers[addr].pool.level -= removeSomeLevels > 0 ? removeSomeLevels : researcher.pool.level;
    researcherPool.removePoolLevels(addr, researcherPoolEra(), removeSomeLevels);
  }

  function addPenalty(address addr, uint256 workId) public mustBeAllowedCaller returns (uint256) {
    penalties[addr].push(Penalty(workId));

    return totalPenalties(addr);
  }

  function totalPenalties(address addr) public view returns (uint256) {
    return penalties[addr].length;
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

    require(researcherPool.canWithdraw(currentEra), "Can't approve withdraw");

    researchers[msg.sender].pool.currentEra++;

    researcherPool.withdraw(msg.sender, currentEra);
  }

  function researcherPoolEra() internal view returns (uint256) {
    return researcherPool.currentContractEra();
  }

  function canPublishWork(address addr) internal view returns (bool) {
    Researcher memory researcher = researchers[addr];
    uint256 lastPublishedAt = researcher.lastPublishedAt;

    bool canPublish = block.number > lastPublishedAt + timeBetweenWorks;
    return canPublish || lastPublishedAt == 0;
  }
}
