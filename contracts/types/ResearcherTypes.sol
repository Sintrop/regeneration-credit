// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Researcher {
  uint256 id;
  address researcherWallet;
  UserType userType;
  string name;
  string document;
  string documentType;
  ResearcherAddress researcherAddress;
}

struct ResearcherAddress {
  string country;
  string state;
  string city;
  string cep;
}
