// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Activist user type data structure.
 * @param id User id.
 * @param activistWallet Activist wallet address.
 * @param name User name.
 * @param proofPhoto Hash of the identity photo.
 * @param pool Pool data.
 * @param createdAt Block of user creation.
 */
struct Activist {
  uint64 id;
  address activistWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 createdAt;
}

/**
 * @dev Activist pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}
