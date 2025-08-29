// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { CommunityTypes } from "./CommunityTypes.sol";

/**
 * @dev Developer user type data structure.
 * @param id User id.
 * @param developerWallet Developer wallet address.
 * @param name User name.
 * @param proofPhoto Hash of the identity photo.
 * @param pool Pool data.
 * @param totalReports Number of published reports.
 * @param createdAt Block of user creation.
 * @param lastPublishedAt Block of last report publication.
 */
struct Developer {
  uint64 id;
  address developerWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 totalReports;
  uint256 createdAt;
  uint256 lastPublishedAt;
}

/**
 * @dev Developer pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

/**
 * @dev Report resource data structure.
 */
struct Report {
  uint64 id;
  uint256 era;
  address developer;
  string description;
  string report;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlockNumber;
}

/**
 * @dev Report penalty.
 */
struct Penalty {
  uint64 reportId;
}

/**
 * @dev System used contracts address.
 */
struct ContractsDependency {
  address communityRulesAddress;
  address developerPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
