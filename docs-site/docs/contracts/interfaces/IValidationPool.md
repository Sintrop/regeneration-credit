# IValidationPool

## IValidationPool

Interface for the ValidationPool contract, which handles token
custody, distribution, and era-based logic for validators.

### canWithdraw

```solidity
function canWithdraw(uint256 era) external view returns (bool)
```

Checks if a validator is eligible to withdraw rewards for a given era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The era number to check eligibility for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the validator can withdraw, false otherwise. |

### withdraw

```solidity
function withdraw(address user, uint256 era) external
```

Allows a user to withdraw their tokens for a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the validator withdrawing tokens. |
| era | uint256 | The era for which the withdrawal is being made. |

### addLevel

```solidity
function addLevel(address user, address denied) external
```

Adds a new level to the user's validation pool from search/hunt service.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the validator. |
| denied | address | The denied address. |

### addPointsLevel

```solidity
function addPointsLevel(address user) external
```

Adds a new level to the user's validation pool from voting points.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the validator. |

### currentContractEra

```solidity
function currentContractEra() external view returns (uint256)
```

Returns the current era of the contract.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current era number. |

### nextEraIn

```solidity
function nextEraIn(uint256 currentEra) external view returns (uint256)
```

Calculates the time or blocks remaining until the next era begins.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentEra | uint256 | The current era, passed as a parameter for calculation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of seconds or blocks until the next era. |

