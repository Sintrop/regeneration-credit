# InspectionStatus

## InspectionStatus

_Inspection posible status_

```solidity
enum InspectionStatus {
  OPEN,
  ACCEPTED,
  INSPECTED,
  INVALIDATED
}
```
## Inspection

_Inspection data structure_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Inspection {
  uint64 id;
  enum InspectionStatus status;
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
```
## ContractsDependency

_System used contracts address_

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address regeneratorRulesAddress;
  address validationRulesAddress;
  address inspectorRulesAddress;
  address regenerationIndexRulesAddress;
  address activistRulesAddress;
  address voteRulesAddress;
}
```
