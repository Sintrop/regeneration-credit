# Researcher

## Researcher

_Researcher user type data structure_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Researcher {
  uint64 id;
  address researcherWallet;
  string name;
  struct Pool pool;
  string proofPhoto;
  uint256 publishedResearches;
  uint256 lastPublishedAt;
  uint256 publishedItems;
  uint256 lastCalculatorItemAt;
  uint256 createdAt;
  bool canPublishMethod;
}
```
## Pool

_Researcher pool data_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
## Research

_Research data structure_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Research {
  uint64 id;
  uint256 era;
  address createdBy;
  string title;
  string thesis;
  string file;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlock;
}
```
## CalculatorItem

_Calculator item data structure_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct CalculatorItem {
  uint64 id;
  address createdBy;
  string item;
  string thesis;
  string unit;
  uint256 carbonImpact;
}
```
## EvaluationMethod

_Evaluation method data structure_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EvaluationMethod {
  uint64 id;
  address createdBy;
  string title;
  string research;
  string projectURL;
}
```
## Penalty

_Research penalty_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Penalty {
  uint256 researchId;
}
```
## ContractsDependency

_System used contracts address_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address researcherPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
```
