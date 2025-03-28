// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

/**
* @dev Activist user type data structure
* @param id User id
* @param activistWallet Activist wallet address
* @param name User name
* @param proofPhoto Hash of the identity photo
* @param pool Pool data
* @param createdAt Block of user creation
*/
struct Activist {
  uint256 id;
  address activistWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 createdAt;
}

/**
* @dev Activist pool data
*/
struct Pool {
  uint256 level;
  uint256 currentEra;
}
