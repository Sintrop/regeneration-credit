// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Contributor user type data structure.
 * @param id User id.
 * @param contributorWallet Contributor wallet address.
 * @param name User name.
 * @param proofPhoto Hash of the identity photo.
 * @param pool Pool data.
 * @param createdAt Block of user creation.
 * @param lastPublishedAt Block of last contribution publication.
 */
struct Contributor {
  uint64 id;
  address contributorWallet;
  string name;
  string proofPhoto;
  Pool pool;
  uint256 totalContributions;
  uint256 createdAt;
  uint256 lastPublishedAt;
}

/**
 * @dev Contributor pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

/**
 * @dev Contribution data structure.
 * @param id Contribution id.
 * @param era Contribution era.
 * @param user Contributor wallet address.
 * @param description Contribution description.
 * @param report Hash of the justification report file.
 * @param validationsCount Number of votes to invalidate.
 * @param valid Boolean if resource is valid or not.
 * @param invalidatedAt Block number of invalidation.
 * @param createdAtBlockNumber Block of contribution creation.
 */
struct Contribution {
  uint64 id;
  uint256 era;
  address user;
  string description;
  string report;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlockNumber;
}

/**
 * @dev Contribution penalty.
 */
struct Penalty {
  uint64 contributionId;
}

/**
 * @dev System used contracts address.
 */
struct ContractsDependency {
  address communityRulesAddress;
  address contributorPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
