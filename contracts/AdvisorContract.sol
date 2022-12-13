// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/AdvisorTypes.sol";
import "./Registrable.sol";

contract AdvisorContract is Registrable {
  mapping(address => Advisor) internal advisors;

  UserContract internal userContract;
  address[] internal advisorsAddress;
  uint256 public advisorsCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
  }

  /**
   * @dev Allow a new register of advisor
   * @param name the name of the advisor
   * @return a Advisor
   */
  function addAdvisor(
    string memory name,
    string memory proofPhoto
  ) public mustBeAllowedUser uniqueAdvisor returns (Advisor memory) {
    uint256 id = advisorsCount + 1;
    UserType userType = UserType.ADVISOR;

    Advisor memory advisor = Advisor(
      id,
      msg.sender,
      userType,
      name,
      proofPhoto
    );

    advisors[msg.sender] = advisor;
    advisorsAddress.push(msg.sender);
    advisorsCount++;
    userContract.addUser(msg.sender, userType);

    return advisor;
  }

  /**
   * @dev Returns all registered advisors
   * @return Advisor struct array
   */
  function getAdvisors() public view returns (Advisor[] memory) {
    Advisor[] memory advisorList = new Advisor[](advisorsCount);

    for (uint256 i = 0; i < advisorsCount; i++) {
      address acAddress = advisorsAddress[i];
      advisorList[i] = advisors[acAddress];
    }

    return advisorList;
  }

  /**
   * @dev Return a specific advisor
   * @param addr the address of the advisor.
   */
  function getAdvisor(address addr) public view returns (Advisor memory) {
    return advisors[addr];
  }

  /**
   * @dev Check if a specific advisor exists
   * @return a bool that represent if a advisor exists or not
   */
  function advisorExists(address addr) public view returns (bool) {
    return bytes(advisors[addr].name).length > 0;
  }

  // MODIFIERS

  modifier uniqueAdvisor() {
    require(!advisorExists(msg.sender), "This advisor already exist");
    _;
  }
}
