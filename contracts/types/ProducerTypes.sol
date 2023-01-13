// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Producer {
  uint256 id;
  address producerWallet;
  UserType userType;
  string name;
  string proofPhoto;
  UserDocument userDocument;
  bool recentInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  Isa isa;
  PropertyAddress propertyAddress;
  Pool pool;
  bool syntropicProducer;
}

struct Pool {
  uint256 currentEra;
}

struct Isa {
  int256 isaScore;
  int256 isaAverage;
  bool sustainable;
}

struct PropertyAddress {
  string country;
  string state;
  string city;
  string street;
  string complement;
  string cep;
}

struct UserDocument {
  string document;
  string documentType;
}
