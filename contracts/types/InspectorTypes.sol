// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Inspector user type data structure.
 * @param id User id.
 * @param inspectorWallet Inspector wallet address.
 * @param name User name.
 * @param proofPhoto Hash of the identity photo.
 * @param totalInspections Number of realized inspections.
 * @param giveUps Number of accepted inspections not realized.
 * @param lastAcceptedAt Block of last accepted inspection.
 * @param lastInspection Block of last realized inspection.
 * @param pool Pool data.
 * @param createdAt Block of user creation.
 */
struct Inspector {
  uint64 id;
  address inspectorWallet;
  string name;
  string proofPhoto;
  uint256 totalInspections;
  uint256 giveUps;
  uint256 lastAcceptedAt;
  uint256 lastRealizedAt;
  uint64 lastInspection;
  Pool pool;
  uint256 createdAt;
}

/**
 * @dev Invalidated inspection penalty.
 */
struct Penalty {
  uint64 inspectionId;
}

/**
 * @dev Inspector pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}
