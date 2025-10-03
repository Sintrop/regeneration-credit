# DeveloperPool

## DeveloperPool

This contract manages the distribution of Regeneration Credit tokens as rewards to developers
for their code development, primarily for the development of the system software.
Developers can contribute to the 'core' front-end, to smart-contracts, UX, website, evaluation methods and any other related open-source projects.
Each valid published development report is equivalent to one level in the pool.

_Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
`Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control)._

### regenerationCredit

```solidity
contract IRegenerationCredit regenerationCredit
```

Interface to the Regeneration Credit token contract, used to decrease total locked.

### developerRulesAddress

```solidity
address developerRulesAddress
```

The address of the `DeveloperRules` contract.

### hasProcessedLevel

```solidity
mapping(uint64 => bool) hasProcessedLevel
```

Tracks unique resource IDs to ensure levels for a resource are added only once.

### constructor

```solidity
constructor(address regenerationCreditAddress, uint256 _halving, uint256 _blocksPerEra) public
```

_Initializes the DeveloperPool contract.
Sets up the Regeneration Credit token interface and initializes inherited base contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerationCreditAddress | address | The address of the RegenerationCredit token contract. |
| _halving | uint256 | The number of eras that constitute one halving cycle/epoch for reward adjustments. Passed to the `Blockable` base contract. |
| _blocksPerEra | uint256 | The number of blocks that constitute a single era. Passed to the `Blockable` base contract. |

### setContractCall

```solidity
function setContractCall(address _developerRulesAddress) external
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _developerRulesAddress | address | Address of DeveloperRules. |

### withdraw

```solidity
function withdraw(address delegate, uint256 era) external
```

This function can only be called by the DeveloperRules contract, whitelisted via the `Callable` contract's mechanisms.
The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.

_Allows an authorized caller, the Developer contract, to trigger a token withdrawal for a user.
This function calculates the eligible tokens for the user's era and transfers them._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegate | address | The address of the user (developer) for whom the withdrawal is being processed. |
| era | uint256 | The last recorded era of the `delegate` user, used for reward calculation and eligibility. |

### addLevel

```solidity
function addLevel(address addr, uint256 levels, uint64 eventId) external
```

Can only be called by the developerRules address.

_Allows an authorized caller to increase the user pool level.
This function updates the developer level within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the developer. |
| levels | uint256 | The number of levels to increase the developer's pool level by. |
| eventId | uint64 | The ID of the report being processed. |

### removePoolLevels

```solidity
function removePoolLevels(address addr, bool denied) external
```

Can only be called by developerRules address.

_Allows an authorized caller to decrease an developer's pool level.
This function adjusts the developer's level downwards within the system's pooling mechanism._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the developer. |
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

