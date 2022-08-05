// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/DeveloperTypes.sol";
import "./Registrable.sol";

/**
 * @title DeveloperContract
 * @dev Developer resource that represent dev
 */
contract DeveloperContract is Registrable {
  mapping(address => Developer) public developers;

  UserContract internal userContract;
  address[] internal developersAddress;
  uint256 public developersCount;

  constructor(address userContractAddress) {
    userContract = UserContract(userContractAddress);
  }

  /**
   * @dev Allow a new register of developer
   * @param name the name of the developer
   * @param document the document of developer
   * @param documentType the document type of developer. CPF/CNPJ
   * @param country the country where the developer is
   * @param state the state of the developer
   * @param city the of the developer
   * @param cep the cep of the developer
   */
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

    Developer memory developer = Developer(
      developersCount + 1,
      msg.sender,
      userType,
      name,
      document,
      documentType,
      Level(1, 1),
      UserAddress(country, state, city, cep),
      block.number
    );

    developers[msg.sender] = developer;
    developersAddress.push(msg.sender);
    userContract.addUser(msg.sender, userType);
    developersCount++;
  }

  /**
   * @dev Returns all registered developers
   * @return Developer struct array
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
   * @dev Return a specific developer
   * @param addr the address of the developer.
   */
  function getDeveloper(address addr) public view returns (Developer memory developer) {
    return developers[addr];
  }

  /**
   * @dev Check if a specific developer exists
   * @return a bool that represent if a developer exists or not
   */
  function developerExists(address addr) public view returns (bool) {
    return developers[addr].id > 0;
  }

  // MODIFIERS

  modifier uniqueDeveloper() {
    require(!developerExists(msg.sender), "This developer already exist");
    _;
  }
}
