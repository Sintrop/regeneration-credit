# Activist

## Activist

_Activist user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Activist {
  uint64 id;
  address activistWallet;
  string name;
  string proofPhoto;
  struct Pool pool;
  uint256 createdAt;
}
```
## Pool

_Activist pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
