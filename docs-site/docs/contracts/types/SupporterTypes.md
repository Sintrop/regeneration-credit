# Supporter

## Supporter

_Supporter user type data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Supporter {
  uint64 id;
  address supporterWallet;
  string name;
  string description;
  string profilePhoto;
  uint32 offsetsCount;
  uint16 reductionItemsCount;
  uint256 createdAt;
}
```
## Offset

_Offset data structure._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Offset {
  address supporterAddress;
  uint256 createdAt;
  uint256 amountBurn;
  uint256 calculatorItemId;
  string message;
}
```
