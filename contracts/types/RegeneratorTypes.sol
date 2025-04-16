// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

/**
 * @dev Regenerator user type data structure
 * @param id User id
 * @param regeneratorWallet Regenerator wallet address
 * @param name User name
 * @param proofPhoto Hash of the identity photo
 * @param totalArea Total regeneration area [m²]
 * @param pendingInspection Bool to check if regenerator has open inspection
 * @param totalInspections Total user inspections
 * @param lastRequestAt Block of last inspection request
 * @param regenerationScore Regenerator score
 * @param pool Pool data
 * @param createdAt Block of user creation
 * @param coordinatesCount Number of coordinate points
 */
struct Regenerator {
  uint256 id;
  address regeneratorWallet;
  string name;
  string proofPhoto;
  uint256 totalArea;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  RegenerationScore regenerationScore;
  Pool pool;
  uint256 createdAt;
  uint256 coordinatesCount;
}

/**
 * @dev Regenerator pool data
 */
struct Pool {
  bool onContractPool;
  uint256 currentEra;
}

/**
 * @dev Regenerator inspection score
 */
struct RegenerationScore {
  uint256 score;
}

/**
 * @dev Regenerator coordinate points
 */
struct Coordinates {
  string latitude;
  string longitude;
}
