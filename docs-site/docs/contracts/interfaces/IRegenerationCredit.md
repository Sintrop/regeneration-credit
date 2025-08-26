# IRegenerationCredit

## IRegenerationCredit

Interface for token interaction with the RegenerationCredit contract.

### balanceOf

```solidity
function balanceOf(address tokenOwner) external view returns (uint256)
```

### allowance

```solidity
function allowance(address owner, address delegate) external view returns (uint256)
```

### transfer

```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address owner, address to, uint256 numTokens) external returns (bool)
```

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

### decreaseLocked

```solidity
function decreaseLocked(uint256 numTokens) external
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Returns the total supply of tokens in existence.

_Standard ERC-20 function._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of tokens. |

### totalCertified_

```solidity
function totalCertified_() external view returns (uint256)
```

Returns the total amount of credits that have been certified.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total certified amount. |

### totalLocked_

```solidity
function totalLocked_() external view returns (uint256)
```

Returns the total amount of tokens currently locked in the protocol.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total locked amount. |

