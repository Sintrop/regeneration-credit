// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Researcher {
  uint256 id;
  address researcherWallet;
  UserType userType;
  string name;
  string proofPhoto;
  string document;
  string documentType;
  ResearcherAddress researcherAddress;
  uint256 publishedWorks;
}

struct ResearcherAddress {
  string country;
  string state;
  string city;
  string cep;
}

struct Work {
  uint256 id;
  address createdBy;
  string title;
  string thesis;
  string file;
  uint256 createdAt;
}
