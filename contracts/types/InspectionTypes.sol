// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

/**
 * @dev Inspection posible status
 */
enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  EXPIRED,
  INVALIDATED
}

/**
 * @dev Inspection data structure
 * @param id Inspection id
 * @param status Inspection status
 * @param regenerator Address of the regenerator
 * @param inspector Address of the inspection inspector
 * @param regenerationScore Inspection regeneration score
 * @param proofPhoto Hash of the inspection proofPhoto
 * @param report Report data and justification of the result
 * @param validationsCount Number of invalidation votes received
 * @param createdAt Creation block.number
 * @param acceptedAt Accepted block.number
 * @param inspectedAt Realize inspection block.number
 * @param inspectedAtEra Era that inspection was realized
 * @param invalidateAt Block of inspection invalidation
 */
struct Inspection {
  uint256 id;
  InspectionStatus status;
  address regenerator;
  address inspector;
  uint256 treesResult;
  uint256 biodiversityResult;
  uint256 regenerationScore;
  string proofPhoto;
  string report;
  uint256 validationsCount;
  uint256 createdAt;
  uint256 acceptedAt;
  uint256 inspectedAt;
  uint256 inspectedAtEra;
  uint256 invalidatedAt;
}

/**
 * @dev System used contracts address
 */
struct ContractsDependency {
  address communityRulesAddress;
  address regeneratorRulesAddress;
  address validationRulesAddress;
  address inspectorRulesAddress;
  address regenerationIndexRulesAddress;
  address activistRulesAddress;
  address voteRulesAddress;
}
