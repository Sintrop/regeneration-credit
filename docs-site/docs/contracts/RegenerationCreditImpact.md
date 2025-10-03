# RegenerationCreditImpact

## RegenerationCreditImpact

This contract is responsible for calculating the system impact and also the impact per token.
The community impact backs the Regeneration Credit, it is the foundation of the System.

_Manages and calculates Regeneration Credit system impact._

### CARBON_PER_TREE

```solidity
uint256 CARBON_PER_TREE
```

[g]
This constant estimates an average carbon sequestration of 100000g (or 100kg) per tree, palm tree and other plants with over 3cm in diameter and 1 meter high recorded by inspectors.
In practice, it is not so simple to make this relationship, as the actual amount of carbon sequestered will vary from species to species,
from biome to biome, from soil to soil, from management to management and from each geolocation.
However, we need to standardize this value to simplify and allow the decentralized certification system to occur.
This result was obtained by estimating that, on average, each tree/plant sequesters 10 kg of carbon per year, living an average of 10 years. With the result expressed in grams [g].

### regenerationCredit

```solidity
contract IRegenerationCredit regenerationCredit
```

Interface to the `RegenerationCredit` contract.

### inspectionRules

```solidity
contract IInspectionRules inspectionRules
```

Interface to the `InspectionRules` contract.

### regeneratorRules

```solidity
contract IRegeneratorRules regeneratorRules
```

Interface to the `RegeneratorRules` contract.

### constructor

```solidity
constructor(address regenerationCreditAddress, address inspectionRulesAddress, address regeneratorRulesAddress) public
```

Initializes the RegenerationCreditImpact contract with addresses of necessary external contracts.

_This constructor links to core system contracts required for impact calculations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerationCreditAddress | address | Address of the RegenerationCredit token contract. |
| inspectionRulesAddress | address | Address of the InspectionRules contract. |
| regeneratorRulesAddress | address | Address of the RegeneratorRules contract. |

### totalTreesImpact

```solidity
function totalTreesImpact() public view returns (uint256)
```

Calculates the total trees of the system.

_This function uses data from inspections and regenerator impact to estimate total trees._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Amount of trees. |

### totalCarbonImpact

```solidity
function totalCarbonImpact() public view returns (uint256)
```

Calculates the total carbon impact of the system.

_Converts the total trees impact into estimated grams of carbon sequestered._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Grams of carbon [g]. |

### totalBiodiversityImpact

```solidity
function totalBiodiversityImpact() public view returns (uint256)
```

Calculates the total biodiversity impact of the system.

_This function uses data from inspections and regenerator impact to estimate total biodiversity species registered._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Total amount of species. |

### totalAreaImpact

```solidity
function totalAreaImpact() public view returns (uint256)
```

Calculates the total area in regeneration proccess of the system.

_This directly returns the total regeneration area reported by regenerators._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Area under regeneration [m²]. |

### treesPerToken

```solidity
function treesPerToken() external view returns (uint256)
```

Calculates the trees impact per Regeneration Credit. The effectiveSupply is the sum of currently
circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.

_The result is a fixed-point number with 18 decimals of precision. It can be formatted
in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18))._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Trees per token (with 18-decimal precision). |

### carbonPerToken

```solidity
function carbonPerToken() external view returns (uint256)
```

Calculates the carbon impact per Regeneration Credit. The effectiveSupply is the sum of currently
circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.

_The result is a fixed-point number with 18 decimals of precision. It can be formatted
in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18))._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Grams of carbon per token (with 18-decimal precision). |

### biodiversityPerToken

```solidity
function biodiversityPerToken() external view returns (uint256)
```

Calculates the biodiversity impact per Regeneration Credit. The effectiveSupply is the sum of currently
circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.

_The result is a fixed-point number with 18 decimals of precision. It can be formatted
in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18))._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Amount of species per token (with 18-decimal precision). |

### areaPerToken

```solidity
function areaPerToken() external view returns (uint256)
```

Calculates the area impact per Regeneration Credit. The effectiveSupply is the sum of currently
circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.

_The result is a fixed-point number with 18 decimals of precision. It can be formatted
in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18))._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Area [m²] per token (with 18-decimal precision). |

