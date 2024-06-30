// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  EXPIRED,
  INVALIDATED
}

struct IsaInspection {
  uint256 categoryId;
  uint256 isaId;
  int256 indicator;
}

struct Inspection {
  uint256 id;
  InspectionStatus status;
  address createdBy;
  address acceptedBy;
  int256 isaScore;
  string report;
  uint256 validationsCount;
  uint256 createdAt;
  uint256 acceptedAt;
  uint256 inspectedAt;
  uint256 inspectedAtEra;
  uint256 invalidatedAt;
}
