# IResearcherRules

## IResearcherRules

Interface for the voting-related query functionalities of the
ResearcherRules contract.

### getResearcher

```solidity
function getResearcher(address account) external view returns (struct Researcher)
```

Retrieves the full Researcher struct for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the researcher. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Researcher | The Researcher struct containing the user's data. |

### getCalculatorItem

```solidity
function getCalculatorItem(uint64 id) external view returns (struct CalculatorItem)
```

Retrieves the full calculatorItem struct for a given id.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The id of the calculatorItem. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CalculatorItem | The Calculator item struct containing the item's data. |

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
function addPenalty(address researcher, uint64 researchId) external returns (uint256)
```

Adds a penalty to a researcher and returns their new total penalty count.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| researcher | address | The address of the researcher receiving the penalty. |
| researchId | uint64 | The ID of the research item related to the penalty. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The new total number of penalties for the researcher. |

### maxPenalties

```solidity
function maxPenalties() external view returns (uint8)
```

Returns the maximum number of penalties a researcher can have before being denied.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The maximum penalty count as a uint8. |

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
function removePoolLevels(address researcher) external
```

Removes a specified level from a researcher's pool configuration.

_As specified, this function does not return a value and takes a single uint256 for the level._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| researcher | address | The address of the researcher. |

### canSendInvite

```solidity
function canSendInvite(address account) external view returns (bool)
```

Checks if a researcher is currently eligible to send an invitation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the researcher account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the researcher can send an invite, false otherwise. |

