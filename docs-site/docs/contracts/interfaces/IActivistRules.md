# IActivistRules

## IActivistRules

Interface for the ActivistRules contract.

### addRegeneratorLevel

```solidity
function addRegeneratorLevel(address regenerator, uint256 totalInspections) external
```

Adds a level Activist when invited user completes 3 totalInspections.

_Called by InspectionRules after a Inspector
completes/realize a inspection._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The address of the Regenerator receiving the inspection. |
| totalInspections | uint256 | The new regenerator totalInspections. |

### addInspectorLevel

```solidity
function addInspectorLevel(address inspector, uint256 totalInspections) external
```

Adds a level Activist when invited user completes 3 totalInspections.

_Called by InspectionRules after a Inspector
completes/realize a inspection._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the Inspector realizing the inspection. |
| totalInspections | uint256 | The new inspector totalInspections. |

### canSendInvite

```solidity
function canSendInvite(address account) external view returns (bool)
```

Checks if an activist is currently eligible to send an invitation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the activist account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the activist can send an invite, false otherwise. |

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
function removePoolLevels(address activist) external
```

Removes a specified level from a activist's pool configuration.

_As specified, this function does not return a value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activist | address | The address of the activist. |

### getActivist

```solidity
function getActivist(address account) external view returns (struct Activist)
```

Retrieves the full Activist struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the activist. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Activist | The Activist struct containing the user's data. |

### totalActiveLevels

```solidity
function totalActiveLevels() external view returns (uint256)
```

Returns the number of approved invites from non-denied users.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total count of totalActiveLevels. |

