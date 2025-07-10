# RegenerationCredit

## RegenerationCredit

Regeneration Credit, token backed by the community's environmental regeneration impact.
This contract manages the token's supply, transfers, approvals,
and introduces specific functionalities for managing tokens within designated "contract pools"
and for burning tokens to certify environmental offset.

_Inherits from OpenZeppelin's `ERC20` for standard token functionalities and `Ownable` for deploy setup._

### NAME

```solidity
string NAME
```

The official name of the token.

### SYMBOL

```solidity
string SYMBOL
```

Token symbol

### DECIMALS

```solidity
uint8 DECIMALS
```

The number of decimal places used by the token.

### contractsPools

```solidity
mapping(address => bool) contractsPools
```

A mapping to track whether an address is a designated "contract pool" for token distribution.

### totalCertified_

```solidity
uint256 totalCertified_
```

The total amount of tokens that have been permanently burned/retired (certified) across the system.
These tokens are out from circulation and represent environmental offset.

### totalLocked_

```solidity
uint256 totalLocked_
```

The total amount of tokens that are currently held by designated contract pools.

### certificate

```solidity
mapping(address => uint256) certificate
```

A mapping to track the amount of tokens burned (certified) by a specific user/supporter.
Represents their individual contribution to environmental offset.

### constructor

```solidity
constructor(uint256 totalSupply) public
```

_Initializes the RegenerationCredit contract by minting the initial supply.
Also sets the token's name, symbol, and decimals via the `ERC20` base constructor._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalSupply | uint256 | The total amount of tokens to be minted. |

### setContractDependencies

```solidity
function setContractDependencies(address supporterRulesAddress) public
```

_onlyOwner function to set contracts dependency.
This function must be called only once after the contract deploy and ownership must be renounced after._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporterRulesAddress | address | Addresses of the SupporterRules contract. |

### addContractPool

```solidity
function addContractPool(address _fundAddress, uint256 _numTokens) public returns (bool)
```

This function is used to fund and activate distribution pools within the ecosystem.

Requirements:
- Only the contract owner can call this function.
- `fundAddress` must not be the zero address.
- The contract must have sufficient balance to transfer `numTokens`.
- `fundAddress` must not already be a contract pool (optional, but good practice to prevent re-funding issues).

_Allows the contract owner to designate a new address as a "contract pool"
and transfer an initial allocation of tokens to it._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _fundAddress | address | The address of the contract to be designated as a pool. |
| _numTokens | uint256 | The amount of tokens to transfer to the new pool. |

### burnTokens

```solidity
function burnTokens(uint256 amount) public
```

Compensate your environmental degradation by burning Regeneration Credit tokens.
Burning tokens permanently removes them from circulation and increases your compensation certificate.

Requirements:
- The caller (`msg.sender`) must have `amount` tokens.
- `amount` must be greater than 0.

_Allows any user to burn their own tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to burn from the caller's balance. |

### offset

```solidity
function offset(uint256 amount, uint64 calculatorItemId) public
```

Allows a supporter to burn tokens to compensate for a specific item's degradation.

_Burns tokens. If a valid calculatorItemId is provided, calls the SupporterRules contract
that records the burned amount as a certificate for that item._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Tokens to be burned (minimum 1 token in wei, i.e., 1e18). |
| calculatorItemId | uint64 | The ID of the CalculatorItem. |

### publish

```solidity
function publish(uint256 amount, string description, string content) public
```

Allows a supporter to burn tokens to post content.

_Burns tokens and creates a new publication record.
Enforces character limits for description and content._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Tokens to be burned (minimum 1 token in wei, i.e., 1e18). |
| description | string | The description of the post (max 600 characters). |
| content | string | The content of the post (max 600 characters). |

### poolTransfer

```solidity
function poolTransfer(address tokenOwner, address receiver, uint256 numTokens) public
```

Called only by a system pool contract, this function remove the transfered tokens from totalLocked.

_Allows a designated "contract pool" to register a new poolTransfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenOwner | address | The address of the contract pool initiating the transfer. |
| receiver | address | The address of the user who will receive the tokens. |
| numTokens | uint256 | The amount of tokens to transfer. |

### totalCertified

```solidity
function totalCertified() public view returns (uint256)
```

Returns the total amount of tokens that have been permanently burned/retired (certified) across the system.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total certified tokens. |

### totalLocked

```solidity
function totalLocked() public view returns (uint256)
```

Returns the total amount of tokens that are currently held by designated contract pools.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total tokens locked in pools. |

### contractPool

```solidity
function contractPool(address poolAddress) public view returns (bool)
```

Checks if a given address is a designated "contract pool" in the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolAddress | address | The address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the address is a contract pool, `false` otherwise. |

### mustBeContractPool

```solidity
modifier mustBeContractPool()
```

_Modifier that restricts a function's execution to only addresses that are
designated as "contract pools" in the `contractsPools` mapping._

### PoolTransfer

```solidity
event PoolTransfer(address from, address to, uint256 amount)
```

_Emitted when tokens are transferred from a designated contract pool to a user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address of the contract pool. |
| to | address | The address of the recipient. |
| amount | uint256 | The amount of tokens transferred. |

### TokensCertified

```solidity
event TokensCertified(address account, uint256 amount, uint256 newAccountCertifiedTotal)
```

_Emitted when tokens are burned (certified) by a user or on behalf of a pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address from which tokens were burned. |
| amount | uint256 | The amount of tokens burned. |
| newAccountCertifiedTotal | uint256 | The total amount of tokens certified by `account`. |

