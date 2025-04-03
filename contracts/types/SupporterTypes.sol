// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

struct Supporter {
  uint256 id;
  address supporterWallet;
  string name;
  uint256 createdAt;
}

struct Publication {
  address supporterAddress;
  uint256 amount;
  string description;
  string content;
}

struct PublicationId {
  uint256 id;
}
