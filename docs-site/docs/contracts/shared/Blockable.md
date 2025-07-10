# Blockable

## Blockable

Contract to manage time-related calculations based on block numbers, including eras and epochs.

_Provides utility functions to determine current era, epoch, and eligibility for actions based on block progression.
Eras and Epochs are 1-indexed._

### BLOCKS_PRECISION

```solidity
uint256 BLOCKS_PRECISION
```

_Precision factor used in calculations._

### halving

```solidity
uint256 halving
```

Defines the number of eras that form one EPOCH cycle.

_Used to determine epoch changes, linked to reward halving adjustments_

### constructor

```solidity
constructor(uint256 _blocksPerEra, uint256 _halving) public
```

_Initializes the Blockable contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _blocksPerEra | uint256 | The number of blocks in each era. Must be greater than 0. |
| _halving | uint256 | The number of eras that constitute one halving cycle/epoch. |

### canWithdraw

```solidity
function canWithdraw(uint256 currentUserEra) public view returns (bool)
```

The user will be eligible for a withdrawal when their era is lower than the current contract era.

_Checks if a user, based on their current era, is eligible for a withdraw._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentUserEra | uint256 | The user's current era. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if currentUserEra is less than the contract's current era, false otherwise. |

### currentContractEra

```solidity
function currentContractEra() public view returns (uint256)
```

Get the current contract era.

_Calculates the current era of the contract based on block progression since deployment._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current contract era. |

### currentEpoch

```solidity
function currentEpoch() public view returns (uint256)
```

Epochs are 1-indexed. The calculation ensures that each epoch (including the first)
comprises exactly `halving` eras, aligning with a conceptual 0-indexed era system for epoch grouping.
For example, assuming halving = 12:
Eras 1-12 (contract era numbers) -> Epoch 1
Eras 13-24 (contract era numbers) -> Epoch 2
And so on.

_Calculates the current EPOCH of the contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Current contract EPOCH. |

### getEpochForEra

```solidity
function getEpochForEra(uint256 era) public view returns (uint256)
```

Follows the same calculation logic as `currentEpoch`.

_Calculates the epoch for a given era number._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The era number to determine the epoch for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The epoch corresponding to the given era. |

### nextEraIn

```solidity
function nextEraIn(uint256 targetEra) public view returns (int256)
```

_Calculates the number of blocks remaining until the start of the next era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| targetEra | uint256 | The era for which to calculate the remaining blocks until its completion. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | int256 Number of blocks until the next era begins. Positive if targetEra is ongoing, negative if targetEra has passed, zero if the current block is the first block of the next era. |

### canWithdrawTimes

```solidity
function canWithdrawTimes(uint256 currentUserEra) public view returns (uint256)
```

Returns 0 if currentUserEra has not yet ended.
The result is scaled by 10**BLOCKS_PRECISION. For example, if 1.5 eras have passed,
and BLOCKS_PRECISION is 5, it returns 150000.

_Calculates a scaled value representing how many "blocksPerEra" periods have elapsed
since a given currentUserEra ended._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentUserEra | uint256 | The era that the user has completed. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Scaled representation of elapsed eras past currentUserEra. |

### _currentBlockNumber

```solidity
function _currentBlockNumber() internal view returns (uint256)
```

_Returns the current block number._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current block.number. |

### canWithdrawModifier

```solidity
modifier canWithdrawModifier(uint256 era)
```

_Modifier to restrict a function's execution until the provided `era` has passed
relative to the contract's current era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The user's current recorded era. |

