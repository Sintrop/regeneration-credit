// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  EXPIRED
}

struct IsaInspection {
  uint256 categoryId;
  uint256 isaIndex;
  string report;
  string proofPhoto;
}

struct Inspection {
  uint256 id;
  InspectionStatus status;
  address createdBy;
  address acceptedBy;
  int256 isaScore;
  uint256 createdAt;
  uint256 updatedAt;
}
