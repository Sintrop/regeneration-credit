// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Developer {
  uint256 id;
  address developerWallet;
  UserType userType;
  string name;
  string proofPhoto;
  string document;
  string documentType;
  Level level;
  UserAddress userAddress;
  uint256 createdAt;
}

struct UserAddress {
  string country;
  string state;
  string city;
  string cep;
}

struct Level {
  uint256 level;
  uint256 currentEra;
}
