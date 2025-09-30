// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Inspection posible status.
 */
enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  INVALIDATED
}

/**
 * @dev Inspection data structure.
 * @param id Inspection id.
 * @param status Inspection status.
 * @param regenerator Address of the regenerator.
 * @param inspector Address of the inspection inspector.
 * @param regenerationScore Inspection regeneration score.
 * @param proofPhoto Hash of the inspection proofPhoto.
 * @param justificationReport Report data and justification of the result.
 * @param validationsCount Number of invalidation votes received.
 * @param createdAt Creation block.number.
 * @param acceptedAt Accepted block.number.
 * @param inspectedAt Realize inspection block.number.
 * @param inspectedAtEra Era that inspection was realized.
 * @param invalidateAt Block of inspection invalidation.
 */
struct Inspection {
  uint64 id;
  InspectionStatus status;
  address regenerator;
  address inspector;
  uint32 treesResult;
  uint32 biodiversityResult;
  uint32 regenerationScore;
  string proofPhotos;
  string justificationReport;
  uint256 validationsCount;
  uint256 createdAt;
  uint256 acceptedAt;
  uint256 inspectedAt;
  uint256 inspectedAtEra;
  uint256 invalidatedAt;
}

/**
 * @dev System used contracts address.
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

/**
 * @notice Tracks the inspection impact of an Era.
 * @dev This struct is used to register the impact of all inspection of an Era.
 * @param trees Trees count.
 * @param biodiversity Biodiversity count.
 * @param realizedInspections Era realizedInspections count.
 */
struct EraImpact {
  uint256 trees;
  uint256 biodiversity;
  uint256 realizedInspections;
}
