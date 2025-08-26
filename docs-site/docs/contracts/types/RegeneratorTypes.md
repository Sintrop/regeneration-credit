# Regenerator

## Regenerator

_Regenerator user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Regenerator {
  uint64 id;
  address regeneratorWallet;
  string name;
  string proofPhoto;
  uint32 totalArea;
  bool pendingInspection;
  uint256 totalInspections;
  uint256 lastRequestAt;
  struct RegenerationScore regenerationScore;
  struct Pool pool;
  uint256 createdAt;
  uint256 coordinatesCount;
  bool isFullyInvalidated;
}
```
## Pool

_Regenerator pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  bool onContractPool;
  uint256 currentEra;
}
```
## RegenerationScore

_Regenerator inspection score._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct RegenerationScore {
  uint256 score;
}
```
## Coordinates

_Regenerator coordinate points._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Coordinates {
  string latitude;
  string longitude;
}
```
