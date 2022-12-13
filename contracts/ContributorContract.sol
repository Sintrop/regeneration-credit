// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/ContributorTypes.sol";
import "./Registrable.sol";

contract ContributorContract is Registrable {
  mapping(address => Contributor) internal contributors;

  UserContract internal userContract;
  address[] internal contributorsAddress;
  uint256 public contributorsCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
  }

  /**
   * @dev Allow a new register of contributor
   * @param name the name of the contributor
   * @return a Contributor
   */
  function addContributor(
    string memory name,
    string memory proofPhoto
  ) public mustBeAllowedUser uniqueContributor returns (Contributor memory) {
    uint256 id = contributorsCount + 1;
    UserType userType = UserType.CONTRIBUTOR;

    Contributor memory contributor = Contributor(
      id,
      msg.sender,
      userType,
      name,
      proofPhoto
    );

    contributors[msg.sender] = contributor;
    contributorsAddress.push(msg.sender);
    contributorsCount++;
    userContract.addUser(msg.sender, userType);

    return contributor;
  }

  /**
   * @dev Returns all registered contributors
   * @return Contributor struct array
   */
  function getContributors() public view returns (Contributor[] memory) {
    Contributor[] memory contributorList = new Contributor[](contributorsCount);

    for (uint256 i = 0; i < contributorsCount; i++) {
      address acAddress = contributorsAddress[i];
      contributorList[i] = contributors[acAddress];
    }

    return contributorList;
  }

  /**
   * @dev Return a specific contributor
   * @param addr the address of the contributor.
   */
  function getContributor(address addr) public view returns (Contributor memory) {
    return contributors[addr];
  }

  /**
   * @dev Check if a specific contributor exists
   * @return a bool that represent if a contributor exists or not
   */
  function contributorExists(address addr) public view returns (bool) {
    return bytes(contributors[addr].name).length > 0;
  }

  // MODIFIERS

  modifier uniqueContributor() {
    require(!contributorExists(msg.sender), "This contributor already exist");
    _;
  }
}
