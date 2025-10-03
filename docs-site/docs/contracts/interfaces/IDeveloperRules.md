# IDeveloperRules

## IDeveloperRules

Interface for the DeveloperRules contract, defining rules
and conditions specific to Developer users.

### canSendInvite

```solidity
function canSendInvite(address account) external view returns (bool)
```

Checks if a developer is currently eligible to send an invitation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the developer account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the developer can send an invite, false otherwise. |

### getDeveloper

```solidity
function getDeveloper(address account) external view returns (struct Developer)
```

Retrieves the full Developer struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the developer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Developer | The Developer struct containing the user's data. |

### totalActiveLevels

```solidity
function totalActiveLevels() external view returns (uint256)
```

Returns the total number of activeLevels from non-denied users.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total count of totalActiveLevels. |

### addPenalty

```solidity
function addPenalty(address developer, uint64 reportId) external returns (uint256)
```

Adds a penalty to a developer and returns their new total penalty count.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| developer | address | The address of the developer receiving the penalty. |
| reportId | uint64 | The ID of the report related to the penalty. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The new total number of penalties for the developer. |

### maxPenalties

```solidity
function maxPenalties() external view returns (uint8)
```

Returns the maximum number of penalties a developer can have before being denied.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The maximum penalty count. |

### poolCurrentEra

```solidity
function poolCurrentEra() external view returns (uint256)
```

Returns the current era of the related pool.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current era number. |

### removePoolLevels

```solidity
function removePoolLevels(address developer) external
```

Removes a specified level from a developer's pool configuration.

_As specified, this function does not return a value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| developer | address | The address of the developer. |

