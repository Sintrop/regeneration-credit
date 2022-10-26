// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Producer {
  uint256 id;
  address producerWallet;
  UserType userType;
  string name;
  string document;
  string documentType;
  bool recentInspection;
  uint256 totalRequests;
  uint256 lastRequestAt;
  Isa isa;
  TokenApprove tokenApprove;
  PropertyAddress propertyAddress;
}

struct Isa {
  int256 isaScore;
  int256 isaAverage;
}

struct TokenApprove {
  uint256 allowed;
  bool withdrewToken;
}

struct PropertyAddress {
  string country;
  string state;
  string city;
  string street;
  string complement;
  string cep;
}
