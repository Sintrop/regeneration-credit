# Developer

## Developer

_Developer user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Developer {
  uint64 id;
  address developerWallet;
  string name;
  string proofPhoto;
  struct Pool pool;
  uint256 totalReports;
  uint256 createdAt;
  uint256 lastPublishedAt;
}
```
## Pool

_Developer pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
## Report

_Report resource data structure._

```solidity
struct Report {
  uint64 id;
  uint256 era;
  address developer;
  string description;
  string report;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlockNumber;
}
```
## Penalty

_Report penalty._

```solidity
struct Penalty {
  uint64 reportId;
}
```
## ContractsDependency

_System used contracts address._

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address developerPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
```
