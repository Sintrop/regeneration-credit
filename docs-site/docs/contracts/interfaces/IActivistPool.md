# IActivistPool

## IActivistPool

Interface for the ActivistPool contract, which handles token
custody, distribution, and era-based logic for activists.

### canWithdraw

```solidity
function canWithdraw(uint256 era) external view returns (bool)
```

Checks if a activist is eligible to withdraw rewards for a given era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The era number to check eligibility for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the activist can withdraw, false otherwise. |

### withdraw

```solidity
function withdraw(address user, uint256 era) external
```

Allows a user to withdraw their tokens for a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the activist withdrawing tokens. |
| era | uint256 | The era for which the withdrawal is being made. |

### removePoolLevels

```solidity
function removePoolLevels(address user, bool denied) external
```

Removes specified levels from a user's pool configuration.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the activist. |
| denied | bool | Remove level user status. If true, user is being denied. |

### addLevel

```solidity
function addLevel(address user, uint256 levels, bytes32 eventId) external
```

Adds a new level to a user's pool configuration.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the activist. |
| levels | uint256 | The levels to be added. |
| eventId | bytes32 |  |

### currentContractEra

```solidity
function currentContractEra() external view returns (uint256)
```

Returns the current era of the contract.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current era number. |

