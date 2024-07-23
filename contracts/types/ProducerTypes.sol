// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Producer {
  uint256 id;
  address producerWallet;
  UserType userType;
  uint256 certifiedArea;
  string name;
  string proofPhoto;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  Isa isa;
  PropertyAddress propertyAddress;
  Pool pool;
}

struct Pool {
  bool onContractPool;
  uint256 currentEra;
}

struct Isa {
  int256 isaScore;
  int256 isaAverage;
  bool sustainable;
}

struct PropertyAddress {
  string coordinate;
}
