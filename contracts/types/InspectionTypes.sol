// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  EXPIRED,
  INVALIDATED
}

struct RegenerationInspection {
  uint256 categoryId;
  uint256 indicator;
}

struct Inspection {
  uint256 id;
  InspectionStatus status;
  address regenerator;
  address inspector;
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
