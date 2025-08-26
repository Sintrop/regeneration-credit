# Callable

## Callable

Base contract to restrict access to certain functions, allowing calls only from a list of authorized addresses (allowedCallers).

_Inherit from this contract and use the `mustBeAllowedCaller` modifier to protect functions.
The list of allowed callers is managed by the contract owner (from Ownable).
If ownership is renounced, only previously added allowed callers will be able to call the functions._

### allowedCallers

```solidity
mapping(address => bool) allowedCallers
```

_Mapping storing the addresses authorized to call protected functions.
`true` if the address is allowed, `false` otherwise._

### constructor

```solidity
constructor() public
```

_Initializes the contract, setting the deployer as the initial owner._

### newAllowedCaller

```solidity
function newAllowedCaller(address allowed) public
```

_Allows the contract owner to add a new address to the list of allowed callers.
If ownership is renounced, this function can no longer be performed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| allowed | address | The address to add to the allowed callers list. |

### isAllowedCaller

```solidity
function isAllowedCaller(address caller) public view returns (bool)
```

Checks if a given address is currently in the list of allowed callers.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| caller | address | The address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the address is an allowed caller, false otherwise. |

### mustBeAllowedCaller

```solidity
modifier mustBeAllowedCaller()
```

Reverts if `msg.sender` is not an allowed caller.

_Modifier to ensure that the function caller (`msg.sender`) is in the `allowedCallers` list._

### mustBeContractCall

```solidity
modifier mustBeContractCall(address addr)
```

Reverts if `msg.sender` is not addr.

_Modifier to ensure that the function caller (`msg.sender`) is in the `addr`.
It is used to only allow calls from a specific contract address._

