// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Inspector {
  uint256 id;
  address inspectorWallet;
  UserType userType;
  string name;
  string proofPhoto;
  uint256 totalInspections;
  uint256 giveUps;
  InspectorAddress inspectorAddress;
  uint256 lastAcceptedAt;
}

struct InspectorAddress {
  string coordinate;
}
