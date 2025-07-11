// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { UserType } from "./CommunityTypes.sol";

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
