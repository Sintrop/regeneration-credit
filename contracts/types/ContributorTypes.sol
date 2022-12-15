// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Contributor {
  uint256 id;
  address contributorWallet;
  UserType userType;
  string name;
  string proofPhoto;
}
