# IInspectionRules

## IInspectionRules

Interface for querying impact metrics and counters
from the InspectionRules contract.

### realizedInspectionsCount

```solidity
function realizedInspectionsCount() external view returns (uint64)
```

Returns the total number of successfully completed inspections.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64 | The total count of realized inspections. |

### inspectionsTreesImpact

```solidity
function inspectionsTreesImpact() external view returns (uint256)
```

Returns a total, aggregated impact score related to trees
across all completed inspections.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total trees impact value. |

### inspectionsBiodiversityImpact

```solidity
function inspectionsBiodiversityImpact() external view returns (uint256)
```

Returns a total, aggregated impact score related to biodiversity
across all completed inspections.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total biodiversity impact value. |

### totalImpactRegenerators

```solidity
function totalImpactRegenerators() external view returns (uint256)
```

Returns the total number of impact regenerators, users with at least one inspection validated.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total of regenerators on the certification process. |

