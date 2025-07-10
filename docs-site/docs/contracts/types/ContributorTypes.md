# Contributor

## Contributor

_Contributor user type data structure_

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
  uint256 createdAt;
  uint256 lastPublishedAt;
}
```
## Pool

_Contributor pool data_

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

_Contribution data structure_

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

_Contribution penalty_

```solidity
struct Penalty {
  uint64 contributionId;
}
```
## ContractsDependency

_System used contracts address_

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address contributorPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
```
