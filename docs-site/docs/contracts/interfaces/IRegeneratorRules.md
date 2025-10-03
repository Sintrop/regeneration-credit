# IRegeneratorRules

## IRegeneratorRules

Interface for the RegeneratorRules contract, which manages the
data and state transitions for Regenerator users, especially regarding inspections.

### getRegenerator

```solidity
function getRegenerator(address account) external view returns (struct Regenerator)
```

Retrieves the full Regenerator struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the regenerator. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Regenerator | The Regenerator struct containing the user's data. |

### afterAcceptInspection

```solidity
function afterAcceptInspection(address regenerator) external
```

A hook to be called after an inspection has been accepted.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The address of the regenerator associated with the inspection. |

### poolCurrentEra

```solidity
function poolCurrentEra() external view returns (uint256)
```

Returns the current era of the related pool.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current era number. |

### afterRequestInspection

```solidity
function afterRequestInspection(address regenerator) external
```

A hook to be called after a regenerator requests an inspection.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The address of the regenerator requesting the inspection. |

### afterRealizeInspection

```solidity
function afterRealizeInspection(address regenerator, uint32 regenerationScore, uint64 inspectionId) external returns (uint256)
```

A hook to be called after an inspection is completed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The address of the regenerator that was inspected. |
| regenerationScore | uint32 | The score calculated from the inspection. |
| inspectionId | uint64 |  |

### nextEraIn

```solidity
function nextEraIn() external view returns (uint256)
```

Calculates the time or blocks remaining until the next era begins.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of seconds or blocks until the next era. |

### decrementInspections

```solidity
function decrementInspections(address regenerator) external
```

Decrements the valid inspections count for a regenerator.

_Called when an inspection is invalidated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | address | The address of the regenerator. |

### removePoolLevels

```solidity
function removePoolLevels(address user) external
```

Removes specified levels from a user's pool configuration.

_The use of 'return' in the calling contract suggests this function
returns a status, likely a boolean indicating success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the regenerator. |

### newCertificationRegenerators

```solidity
function newCertificationRegenerators(uint256 era) external view returns (uint256)
```

Returns the number of new regenerators that achieved impact status in a specific era.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| era | uint256 | The era number to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The count of new impact regenerators for that era. |

### regenerationArea

```solidity
function regenerationArea() external view returns (uint256)
```

Returns the total area under regeneration across all regenerators.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total regeneration area, in square meters. |

### removeInspectionLevels

```solidity
function removeInspectionLevels(address addr, uint256 amountToRemove) external
```

Returns the total area under regeneration across all regenerators.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the regenerator. |
| amountToRemove | uint256 | Levels/score to be removed. |

