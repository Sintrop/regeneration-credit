# IContributorRules

## IContributorRules

Interface for the ContributorRules contract, defining rules
and conditions specific to Contributor users.

### canSendInvite

```solidity
function canSendInvite(address account) external view returns (bool)
```

Checks if a contributor is currently eligible to send an invitation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the contributor account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the contributor can send an invite, false otherwise. |

### getContributor

```solidity
function getContributor(address account) external view returns (struct Contributor)
```

Retrieves the full Contributor struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the contributor. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Contributor | The Contributor struct containing the user's data. |

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
function addPenalty(address contributor, uint64 reportId) external returns (uint256)
```

Adds a penalty to a contributor and returns their new total penalty count.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributor | address | The address of the contributor receiving the penalty. |
| reportId | uint64 | The ID of the report related to the penalty. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The new total number of penalties for the contributor. |

### maxPenalties

```solidity
function maxPenalties() external view returns (uint8)
```

Returns the maximum number of penalties a contributor can have before being denied.

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
function removePoolLevels(address contributor) external
```

Removes a specified level from a contributor's pool configuration.

_As specified, this function does not return a value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributor | address | The address of the contributor. |

