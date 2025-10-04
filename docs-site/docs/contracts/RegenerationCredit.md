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

Token symbol.

### DECIMALS

```solidity
uint8 DECIMALS
```

The number of decimal places used by the token.

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

### addContractPool

```solidity
function addContractPool(address _fundAddress, uint256 _numTokens) external returns (bool)
```

This function is used to fund and activate distribution pools within the ecosystem.

Requirements:
- Only the contract owner can call this function.
- `fundAddress` must not be the zero address.
- The caller must have sufficient balance to transfer `numTokens`.

_Allows the contract owner to designate a new address as a "contract pool"
and transfer an initial allocation of tokens to it. Tokens are set as locked when transfered to the pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _fundAddress | address | The address of the contract to be designated as a pool. |
| _numTokens | uint256 | The amount of tokens to transfer to the new pool. |

### burnTokens

```solidity
function burnTokens(uint256 amount) external
```

Compensate your environmental degradation by burning Regeneration Credit tokens.
Burning tokens permanently removes them from circulation and increases your compensation certificate.

Requirements:
- The caller (`msg.sender`) must have `amount` tokens.
- `amount` must be greater than 0.

Note: This functions uses the token 18 decimals, to burn 1 RC user must write 1000000000000000000.

_Allows any user to burn their own tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to burn from the caller's balance. |

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public
```

Destroys a specific amount of tokens from a target account and updates certification records.

_Overrides the standard ERC20Burnable `burnFrom` to include custom certification logic
by calling the internal `_burnTokensInternal` function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the token holder whose tokens will be burned. |
| amount | uint256 | The amount of tokens to burn. |

### decreaseLocked

```solidity
function decreaseLocked(uint256 numTokens) external
```

Called only by a system pool contract, this function remove the transfered tokens from totalLocked.

_Allows a designated "contract pool" to register a new decreaseLocked._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
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

### TokensCertified

```solidity
event TokensCertified(address account, uint256 amount, uint256 newAccountCertifiedTotal)
```

_Emitted when tokens are burned (certified) by a user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address from which tokens were burned. |
| amount | uint256 | The amount of tokens burned. |
| newAccountCertifiedTotal | uint256 | The total amount of tokens certified by `account`. |

