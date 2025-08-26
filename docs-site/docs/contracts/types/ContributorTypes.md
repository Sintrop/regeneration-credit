# Contributor

## Contributor

_Contributor user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Contributor {
  uint64 id;
  address contributorWallet;
  string name;
  string proofPhoto;
  struct Pool pool;
  uint256 totalContributions;
  uint256 createdAt;
  uint256 lastPublishedAt;
}
```
## Pool

_Contributor pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
## Contribution

_Contribution data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Contribution {
  uint64 id;
  uint256 era;
  address user;
  string description;
  string report;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlockNumber;
}
```
## Penalty

_Contribution penalty._

```solidity
struct Penalty {
  uint64 contributionId;
}
```
## ContractsDependency

_System used contracts address._

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address contributorPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
```
