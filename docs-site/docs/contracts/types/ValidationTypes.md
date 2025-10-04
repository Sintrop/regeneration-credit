# ContractsDependency

## ContractsDependency

_System used contracts address._

```solidity
struct ContractsDependency {
  address communityRulesAddress;
  address regeneratorRulesAddress;
  address inspectorRulesAddress;
  address developerRulesAddress;
  address researcherRulesAddress;
  address contributorRulesAddress;
  address activistRulesAddress;
  address voteRulesAddress;
  address validationPoolAddress;
}
```
## Pool

_Validation pool data._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Pool {
  uint256 level;
  uint256 currentEra;
}
```
