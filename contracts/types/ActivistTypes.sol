// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Activist {
  uint256 id;
  address activistWallet;
  UserType userType;
  string name;
  string proofPhoto;
  string document;
  string documentType;
  uint256 totalInspections;
  uint256 giveUps;
  ActivistAddress activistAddress;
  uint256 lastAcceptedAt;
}

struct ActivistAddress {
  string country;
  string state;
  string city;
  string cep;
}
