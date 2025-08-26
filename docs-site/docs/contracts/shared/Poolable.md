# Poolable

## Poolable

Manages token distribution logic across different eras based on user levels and a halving mechanism.

_This abstract contract provides the core functionalities for calculating token allocations,
tracking user participation (levels and withdrawals) within specific eras, and managing the pool token supply.
It is designed to be inherited by other pool contracts._

### totalTokens

```solidity
uint256 totalTokens
```

The total supply of tokens to be managed by this contract.

_This value is set once during contract deployment and remains constant._

### eras

```solidity
mapping(uint256 => struct Era) eras
```

Era data includes: count of claims/withdrawals, total tokens claimed, and total active levels or difficulty.

_Stores data for each era. Key is the era number._

### eraLevels

```solidity
mapping(uint256 => mapping(address => uint256)) eraLevels
```

_Tracks the levels of each user per era. Mapping: eraNumber => userAddress => levels._

### eraTokens

```solidity
mapping(uint256 => mapping(address => uint256)) eraTokens
```

_Tracks the tokens claimed by each user per era. Mapping: eraId => userAddress => eraTokens._

### hasWithdrawn

```solidity
mapping(uint256 => mapping(address => bool)) hasWithdrawn
```

Tracks withdrawals to ensure a user can only claim rewards once per era.

### constructor

```solidity
constructor(uint256 _totalTokens) public
```

_Initializes the contract with the total amount of tokens for the pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _totalTokens | uint256 | The total supply of tokens to be managed by this contract. |

### getEra

```solidity
function getEra(uint256 era) external view returns (struct Era)
```

Returns the aggregated data for a specific era.

_Provides access to `claimsCount`, `tokens` claimed, and `levels` for the requested era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The number of the era to retrieve data for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Era | Era The `Era` struct containing the aggregated details for the specified era. |

### tokensPerEra

```solidity
function tokensPerEra(uint256 currentEpoch, uint256 halvingFactor) public view returns (uint256)
```

Tokens of actual ERA.

_Returns the amount of tokens to be distributed to users in current era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentEpoch | uint256 | The current epoch number, used to determine halving mechanism. |
| halvingFactor | uint256 | The number of eras for halving. |

### tokensPerEpoch

```solidity
function tokensPerEpoch(uint256 currentEpoch) public view returns (uint256)
```

Tokens halve with each successive epoch: totalTokens / (2^currentEpoch).

_Calculates the base amount of tokens to be distributed in an epoch._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentEpoch | uint256 | The current epoch number. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of tokens for the epoch. |

### _calculateUserEraTokens

```solidity
function _calculateUserEraTokens(uint256 era, address to, uint256 _tokensPerEra) internal view returns (uint256)
```

Calculates the amount of tokens a user is eligible to withdraw in a specific era.

_The calculation is based on the user's levels relative to the total levels in that era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | Era number. |
| to | address | UserAddress. |
| _tokensPerEra | uint256 | The total tokens available for distribution in this specific era. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of tokens the user can claim. Returns 0 if the user has no levels. |

### _haveTokensToWithdraw

```solidity
function _haveTokensToWithdraw(address delegate, uint256 era, uint256 _tokensPerEra) internal view returns (bool)
```

Private function to check if a user have tokens to withdraw at an era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegate | address | User address. |
| era | uint256 | User current era. |
| _tokensPerEra | uint256 | Pool tokensPerEra. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if have tokens to withdraw, false if will just update era. |

### _updateEraAfterWithdraw

```solidity
function _updateEraAfterWithdraw(uint256 era, address user, uint256 numTokens) internal
```

This function should be called internally after a successful token withdrawal process.
It increments the era's claims count and total tokens claimed.

_Updates era data after a user withdraw._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The number of the era. |
| user | address | The address of the user who claimed tokens. |
| numTokens | uint256 | The amount of tokens claimed by the user. |

### _addPoolLevel

```solidity
function _addPoolLevel(address to, uint256 levels, uint256 era) internal
```

_Adds pool levels to a user for a specific era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address of the user. |
| levels | uint256 | The amount of levels to add. |
| era | uint256 | The number of the era. |

### _removePoolLevel

```solidity
function _removePoolLevel(address _user, uint256 _era, uint256 _amountToRemove) internal
```

_Removes pool levels users._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address of the user. |
| _era | uint256 | The number of the era. |
| _amountToRemove | uint256 | The amount of levels to remove. |

### hasWithdrawnEraModifier

```solidity
modifier hasWithdrawnEraModifier(uint256 era, address delegate)
```

### PoolLevelAdded

```solidity
event PoolLevelAdded(address user, uint256 era, uint256 levelsAdded, uint256 newTotalEraLevels, uint256 newEraUserLevels)
```

Emitted when a user's pool levels are added for a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user whose levels were added. |
| era | uint256 | The era number where levels were added. |
| levelsAdded | uint256 | The amount of levels added. |
| newTotalEraLevels | uint256 | The new total levels for the era. |
| newEraUserLevels | uint256 | The new total levels for the user in that era. |

### PoolLevelRemoved

```solidity
event PoolLevelRemoved(address user, uint256 era, uint256 levelsRemoved, uint256 newTotalEraLevels, uint256 newEraUserLevels)
```

Emitted when a user's pool levels are removed for a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user whose levels were removed. |
| era | uint256 | The era number where levels were removed. |
| levelsRemoved | uint256 | The amount of levels removed. |
| newTotalEraLevels | uint256 | The new total levels for the era. |
| newEraUserLevels | uint256 | The new total levels for the user in that era. |

### TokensWithdrawn

```solidity
event TokensWithdrawn(address user, uint256 era, uint256 amount)
```

Emitted when a user successfully withdrawals tokens for a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user who withdrew tokens. |
| era | uint256 | The era number from which tokens were withdrawn. |
| amount | uint256 | The amount of tokens withdrawn. |

