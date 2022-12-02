// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Advisor {
  uint256 id;
  address advisorWallet;
  UserType userType;
  string name;
  string proofPhoto;
  string document;
  string documentType;
  AdvisorAddress advisorAddress;
}

struct AdvisorAddress {
  string country;
  string state;
  string city;
  string cep;
}
