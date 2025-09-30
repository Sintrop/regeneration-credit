// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev System used contracts address.
 */
struct ContractsDependency {
  address communityRulesAddress;
  address regeneratorRulesAddress;
  address inspectorRulesAddress;
  address developerRulesAddress;
  address researcherRulesAddress;
  address contributorRulesAddress;
  address activistRulesAddress;
  address voteRulesAddress;
  address validationPoolAddress;
}

/**
 * @dev Validation pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}
