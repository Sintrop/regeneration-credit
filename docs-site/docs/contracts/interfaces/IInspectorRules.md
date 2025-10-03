# IInspectorRules

## IInspectorRules

Interface for the InspectorRules contract, which manages the rules,
status, and actions for Inspector users.

### isInspectorValid

```solidity
function isInspectorValid(address account) external view returns (bool)
```

Checks if an inspector is still valid and has not exceeded their limits (e.g., give-ups).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the inspector to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the inspector is valid, false otherwise. |

### canAcceptInspection

```solidity
function canAcceptInspection(address account) external view returns (bool)
```

Checks if an inspector is currently able to accept a new inspection.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the inspector. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the inspector can accept an inspection, false otherwise. |

### afterAcceptInspection

```solidity
function afterAcceptInspection(address inspector, uint64 inspectionId) external
```

A hook to be called after an inspector accepts an inspection.

_Updates the inspector's state accordingly._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the inspector. |
| inspectionId | uint64 | The ID of the inspection that was accepted. |

### afterRealizeInspection

```solidity
function afterRealizeInspection(address inspector, uint32 score, uint64 inspectionId) external returns (uint256)
```

A hook to be called after an inspector successfully completes an inspection.

_This function likely updates the inspector's counters and returns their new level or score._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the inspector who completed the inspection. |
| score | uint32 | The regenerationScore of the inspection. |
| inspectionId | uint64 | The inspection unique ID. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The new calculated level for the inspector. |

### denyInspector

```solidity
function denyInspector(address inspector) external
```

_Function to deny inspectors._

### getInspector

```solidity
function getInspector(address account) external view returns (struct Inspector)
```

Retrieves the full Inspector struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the inspector. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Inspector | The Inspector struct containing the user's data. |

### addPenalty

```solidity
function addPenalty(address inspector, uint64 inspectionId) external returns (uint256)
```

Adds a penalty to an inspector and returns their new total penalty count.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the inspector receiving the penalty. |
| inspectionId | uint64 | The ID of the inspection related to the penalty. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The new total number of penalties for the inspector. |

### maxPenalties

```solidity
function maxPenalties() external view returns (uint8)
```

Returns the maximum number of penalties an inspector can have before being denied.

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

### decrementInspections

```solidity
function decrementInspections(address inspector) external
```

Decrements the active inspections count for an inspector.

_Likely called when an inspection is cancelled or invalidated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the inspector. |

### removePoolLevels

```solidity
function removePoolLevels(address inspector, bool denied) external
```

Removes a specified level from an inspector's pool configuration.

_As specified, this function does not return a value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspector | address | The address of the inspector. |
| denied | bool | Remove level user status. If true, user is being denied. |

