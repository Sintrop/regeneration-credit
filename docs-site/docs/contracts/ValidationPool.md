# ValidationPool

## ValidationPool

This contract manages the distribution of Regeneration Credit tokens as rewards to validators.

_Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
`Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control)._

### regenerationCredit

```solidity
contract IRegenerationCredit regenerationCredit
```

Interface to the Regeneration Credit token contract, used to decrease total locked.

### validationRulesAddress

```solidity
address validationRulesAddress
```

The address of the `ValidationRules` contract.

### hasProcessedLevel

```solidity
mapping(address => bool) hasProcessedLevel
```

Tracks unique resource IDs to ensure levels for a resource are added only once.

### constructor

```solidity
constructor(address regenerationCreditAddress, uint256 _halving, uint256 _blocksPerEra) public
```

_Initializes the ValidationPool contract.
Sets up the Regeneration Credit token interface and initializes inherited base contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerationCreditAddress | address | The address of the RegenerationCredit token contract. |
| _halving | uint256 | The number of eras that constitute one halving cycle/epoch for reward adjustments. Passed to the `Blockable` base contract. |
| _blocksPerEra | uint256 | The number of blocks that constitute a single era. Passed to the `Blockable` base contract. |

### setContractCall

```solidity
function setContractCall(address _validationRulesAddress) external
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validationRulesAddress | address | Address of ValidationRules. |

### withdraw

```solidity
function withdraw(address delegate, uint256 era) external
```

This function can only be called by the ValidationRules contract, whitelisted via the `Callable` contract's mechanisms.
The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.

_Allows an authorized caller, the Validation contract, to trigger a token withdrawal for a user.
This function calculates the eligible tokens for the user's era and transfers them._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegate | address | The address of the user (validation) for whom the withdrawal is being processed. |
| era | uint256 | The last recorded era of the `delegate` user, used for reward calculation and eligibility. |

### addLevel

```solidity
function addLevel(address addr, address denied) external
```

Can only be called by the validationRules address.

_Allows an authorized caller to increase the user pool level.
This function updates the validation level within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the validation. |
| denied | address | The address of the denied user. |

### addPointsLevel

```solidity
function addPointsLevel(address addr) external
```

Can only be called by the validationRules address.

_Allows an authorized caller to increase the user pool level.
This function updates the validation level within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the validation. |

### haveTokensToWithdraw

```solidity
function haveTokensToWithdraw(address delegate, uint256 era) external view returns (bool)
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

