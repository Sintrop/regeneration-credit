// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Regenerator user type data structure.
 * @param id User id.
 * @param regeneratorWallet Regenerator wallet address.
 * @param name User name.
 * @param proofPhoto Hash of the identity photo.
 * @param totalArea Total regeneration area. [m²]
 * @param pendingInspection Bool to check if regenerator has open inspection.
 * @param totalInspections Total user inspections.
 * @param lastRequestAt Block of last inspection request.
 * @param regenerationScore Regenerator score.
 * @param pool Pool data.
 * @param createdAt Block of user creation.
 * @param coordinatesCount Number of coordinate points.
 */
struct Regenerator {
  uint64 id;
  address regeneratorWallet;
  string name;
  string proofPhoto;
  uint32 totalArea;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  RegenerationScore regenerationScore;
  Pool pool;
  uint256 createdAt;
  uint256 coordinatesCount;
  bool isFullyInvalidated;
}

/**
 * @dev Regenerator pool data.
 * @param onContractPool True if regenerator received 3 or more inspections.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  bool onContractPool;
  uint256 currentEra;
}

/**
 * @dev Regenerator inspection score.
 * @param score Regenerator score, received after realized inspections.
 */
struct RegenerationScore {
  uint256 score;
}

/**
 * @dev Regenerator coordinate points.
 * @param latitude The latitude coordinate points (e.g., -13.726317).
 * @param longitude The longitude coordinate points (e.g., -39.462539).
 */
struct Coordinates {
  string latitude;
  string longitude;
}
