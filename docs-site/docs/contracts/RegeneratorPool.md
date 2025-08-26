# RegeneratorPool

## RegeneratorPool

This contract manages the distribution of Regeneration Credit tokens as rewards to regenerators
for their ecosystem regeneration service provided.
The reward is distributed related to the RegenerationScore, the result of each inspection that ranges from [0, 64].

_Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
`Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control)._

### MAX_NEW_LEVELS

```solidity
uint256 MAX_NEW_LEVELS
```

Maximum possible score from a single resource.

### hasProcessedLevel

```solidity
mapping(uint64 => bool) hasProcessedLevel
```

Tracks unique resource IDs to ensure levels for a resource are added only once.

### constructor

```solidity
constructor(address regenerationCreditAddress, uint256 _halving, uint256 _blocksPerEra) public
```

_Initializes the RegeneratorPool contract.
Sets up the Regeneration Credit token interface and initializes inherited base contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerationCreditAddress | address | The address of the RegenerationCredit token contract. |
| _halving | uint256 | The number of eras that constitute one halving cycle/epoch for reward adjustments. Passed to the `Blockable` base contract. |
| _blocksPerEra | uint256 | The number of blocks that constitute a single era. Passed to the `Blockable` base contract. |

### setContractCall

```solidity
function setContractCall(address _regeneratorRulesAddress) external
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _regeneratorRulesAddress | address | Address of RegeneratorRules. |

### withdraw

```solidity
function withdraw(address delegate, uint256 era) external
```

This function can only be called by the RegeneratorRules contract, whitelisted via the `Callable` contract's mechanisms.
The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.

_Allows an authorized caller, the Regenerator contract, to trigger a token withdrawal for a user.
This function calculates the eligible tokens for the user's era and transfers them._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegate | address | The address of the user (regenerator) for whom the withdrawal is being processed. |
| era | uint256 | The last recorded era of the `delegate` user, used for reward calculation and eligibility. |

### addLevel

```solidity
function addLevel(address regenerator, uint256 levels, uint64 inspectionId) external
```

Can only be called by the regeneratorRules address.

_Allows an authorized caller to increase the user pool level.
This function updates the regenerator level within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The wallet address of the regenerator. |
| levels | uint256 | The number of levels to increase the regenerator's pool level by. |
| inspectionId | uint64 | The id of the inspection being processed. |

### removePoolLevels

```solidity
function removePoolLevels(address addr, uint256 amountToRemove, bool denied) external
```

Can only be called by regeneratorRules address.

_Allows an authorized caller to decrease an regenerator's pool level.
This function adjusts the regenerator's level downwards within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the regenerator. |
| amountToRemove | uint256 | The number of levels/score points to decrease. |
| denied | bool | Remove level user status. If true, user is being denied. |

### haveTokensToWithdraw

```solidity
function haveTokensToWithdraw(address delegate, uint256 era) public view returns (bool)
```

View function to check if a user have tokens to withdraw at an era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegate | address | User address. |
| era | uint256 | User current era. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if have tokens to withdraw, false if will just update era. |

