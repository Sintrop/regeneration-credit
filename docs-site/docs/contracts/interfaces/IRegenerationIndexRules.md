# IRegenerationIndexRules

## IRegenerationIndexRules

Interface for the RegenerationIndexRules contract, which is responsible
for calculating a standardized regeneration score.

### calculateScore

```solidity
function calculateScore(uint32 treesResult, uint32 biodiversityResult) external view returns (uint32)
```

Calculates a regeneration score based on tree and biodiversity metrics.

_A pure function for on-the-fly score calculation. It can be called
by any contract to determine regeneration scores based on a consistent formula._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| treesResult | uint32 | A numerical result or score related to tree metrics. |
| biodiversityResult | uint32 | A numerical result or score related to biodiversity metrics. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The final calculated regeneration score. |

