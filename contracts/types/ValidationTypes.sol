// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { UserType } from "./CommunityTypes.sol";

/**
 * @dev User validation data structure
 * @param validator Validator wallet address
 * @param user User wallet address
 * @param justification Justification or reason of the vote
 * @param votesToInvalidate Current votes necessary to invalidate
 * @param createdAtBlockNumber Block.number of the validation
 */
struct UserValidation {
  address validator;
  address user;
  string justification;
  uint256 votesToInvalidate;
  uint256 createdAtBlockNumber;
}

/**
 * @dev User validation data structure
 * @param validator Validator wallet address
 * @param resourceId Resource id that is receiving the invalidation
 * @param justification Justification or reason of the vote
 * @param votesToInvalidate Current votes necessary to invalidate
 * @param createdAtBlockNumber Block.number of the validation
 */
struct ResourceValidation {
  address validator;
  uint256 resourceId;
  string justification;
  uint256 votesToInvalidate;
  uint256 createdAtBlockNumber;
}

/**
 * @dev System used contracts address
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
}
