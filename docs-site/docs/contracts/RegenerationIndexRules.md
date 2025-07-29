# RegenerationIndexRules

## RegenerationIndexRules

This contract handles the RegenerationIndexRules, used by the inspections to estimate the Regenerator impact
and calculate the RegnerationScore. The system will have only two categories: Trees & Biodiversity.

_Manage index categories and score._

### CATEGORY_COUNTS

```solidity
uint8 CATEGORY_COUNTS
```

Allowed categories: Trees & Biodiversity.

### categories

```solidity
mapping(uint8 => struct Category) categories
```

Relationship between id and category data

### categoryRegenerationIndexDescriptions

```solidity
mapping(uint8 => struct RegenerationIndexDescription[]) categoryRegenerationIndexDescriptions
```

Relationship between category id and category descriptions

### regenerationIndex

```solidity
mapping(uint32 => struct RegenerationIndex) regenerationIndex
```

Relationship between regeneration index id and its name/value

### constructor

```solidity
constructor() public
```

### getCategoryRegenerationIndexDescription

```solidity
function getCategoryRegenerationIndexDescription(uint8 categoryId) external view returns (struct RegenerationIndexDescription[])
```

Returns all added regeneration index descriptions for a specific category.

_Validates the provided category ID to ensure it exists._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| categoryId | uint8 | The ID of the category to retrieve descriptions for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct RegenerationIndexDescription[] | RegenerationIndexDescription struct array for the specified category. |

### calculateScore

```solidity
function calculateScore(uint32 treesResult, uint32 biodiversityResult) external view returns (uint32)
```

Calculates the overall inspection score based on trees and biodiversity results.

_This function sums the regeneration index values for trees and biodiversity indicators._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| treesResult | uint32 | Inspection result provided by inspector for trees. |
| biodiversityResult | uint32 | Inspection result provided by inspector for biodiversity. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | uint256 The combined inspection score. |

