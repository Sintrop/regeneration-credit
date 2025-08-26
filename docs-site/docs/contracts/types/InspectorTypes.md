# Inspector

## Inspector

_Inspector user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Inspector {
  uint64 id;
  address inspectorWallet;
  string name;
  string proofPhoto;
  uint256 totalInspections;
  uint256 giveUps;
  uint256 lastAcceptedAt;
  uint256 lastRealizedAt;
  uint64 lastInspection;
  struct Pool pool;
  uint256 createdAt;
}
```
## Penalty

_Invalidated inspection penalty._

```solidity
struct Penalty {
  uint64 inspectionId;
}
```
## Pool

_Inspector pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
