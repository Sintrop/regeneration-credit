// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./CommunityTypes.sol";

/**
 * @dev Developer user type data structure
 * @param id User id
 * @param developerWallet Developer wallet address
 * @param name User name
 * @param proofPhoto Hash of the identity photo
 * @param pool Pool data
 * @param totalReports Number of published reports
 * @param createdAt Block of user creation
 * @param lastPublishedAt Block of last report publication
 */
struct Developer {
  uint256 id;
  address developerWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 totalReports;
  uint256 createdAt;
  uint256 lastPublishedAt;
}

/**
 * @dev Developer pool data
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

/**
 * @dev Report resource data structure
 */
struct Report {
  uint256 id;
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
 * @dev Report penalty
 */
struct Penalty {
  uint256 reportId;
}

/**
 * @dev System used contracts address
 */
struct ContractsDependency {
  address communityRulesAddress;
  address developerPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
