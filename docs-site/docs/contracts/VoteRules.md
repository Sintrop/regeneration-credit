# VoteRules

## VoteRules

Defines the rules and logic for determining if a user is eligible to vote for invalidation.

_This contract calculates voting eligibility based on a user's levels relative to their user type's average levels._

### INITIAL_USER_COUNT_THRESHOLD

```solidity
uint256 INITIAL_USER_COUNT_THRESHOLD
```

_The threshold of total users below (or equal to) which any user can invite.
This allows for easier invitations in the early stages of the system._

### communityRules

```solidity
contract ICommunityRules communityRules
```

CommunityRules contract interface.

### contributorRules

```solidity
contract IContributorRules contributorRules
```

ContributorRules contract interface.

### developerRules

```solidity
contract IDeveloperRules developerRules
```

DeveloperRules contract interface.

### researcherRules

```solidity
contract IResearcherRules researcherRules
```

ResearcherRules contract interface.

### constructor

```solidity
constructor(address communityRulesAddress, address contributorRulesAddress, address developerRulesAddress, address researcherRulesAddress) public
```

_Initializes the contract with the addresses of the various rule contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | Address of the CommunityRules contract. |
| contributorRulesAddress | address | Address of the ContributorRules contract. |
| developerRulesAddress | address | Address of the DeveloperRules contract. |
| researcherRulesAddress | address | Address of the ResearcherRules contract. |

### canVote

```solidity
function canVote(address addr) public view returns (bool)
```

Checks if a given address is eligible to send a vote based on predefined rules.

_This function calculates a user's eligibility by comparing their levels to the average levels of their user type.
It also requires the user to be designated as a 'voter' in CommunityRules._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the user can vote, false otherwise. |

