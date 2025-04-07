// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./CommunityTypes.sol";

/**
 * @dev Contributor user type data structure
 * @param id User id
 * @param contributorWallet Contributor wallet address
 * @param name User name
 * @param proofPhoto Hash of the identity photo
 * @param pool Pool data
 * @param createdAt Block of user creation
 * @param lastPublishedAt Block of last contribution publication
 */
struct Contributor {
  uint256 id;
  address contributorWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 createdAt;
  uint256 lastPublishedAt;
}

/**
 * @dev Contributor pool data
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

/**
 * @dev Contribution data structure
 * @param id Contribution id
 * @param era Contribution era
 * @param user Contributor wallet address
 * @param description Contribution description
 * @param report Hash of the justification report file
 * @param createdAtBlockNumber Block of contribution creation
 */
struct Contribution {
  uint256 id;
  uint256 era;
  address user;
  string description;
  string report;
  uint256 createdAtBlockNumber;
}
