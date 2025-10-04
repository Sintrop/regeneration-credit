# InvitationRules

## InvitationRules

This contract manages the rules and logic for users to invite others into the community.

_Manages the logic to allow users to invite others to the community._

### ACTIVIST_DELAY_BLOCKS

```solidity
uint16 ACTIVIST_DELAY_BLOCKS
```

The minimum number of blocks an activist needs to wait to invite Regenerators or Inspectors again.

### lastInviteBlocks

```solidity
mapping(address => uint256) lastInviteBlocks
```

Relationship between address and last general invitation blockNumber.

### lastInviteActivist

```solidity
mapping(address => uint256) lastInviteActivist
```

Relationship between activist address and last activist invitation blockNumber (for Regenerator/Inspector).

### canBeInviteds

```solidity
mapping(enum CommunityTypes.UserType => enum CommunityTypes.UserType) canBeInviteds
```

Maps which UserType (inviter) can invite which other UserTypes (invited).

_The key is the inviter's UserType, and the value is a mapping from UserType (invited) to a boolean (true if allowed)._

### communityRules

```solidity
contract ICommunityRules communityRules
```

CommunityRules contract interface

### researcherRules

```solidity
contract IResearcherRules researcherRules
```

ResearcherRules contract interface

### developerRules

```solidity
contract IDeveloperRules developerRules
```

DeveloperRules contract interface

### activistRules

```solidity
contract IActivistRules activistRules
```

ActivistRules contract interface

### contributorRules

```solidity
contract IContributorRules contributorRules
```

ContributorRules contract interface

### constructor

```solidity
constructor(address communityRulesAddress, address researcherRulesAddress, address developerRulesAddress, address activistRulesAddress, address contributorRulesAddress) public
```

Constructor that initializes the addresses of the rule contracts and defines invitation permissions.

_Ensures that all contract addresses are valid (not null)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | Address of the CommunityRules contract. |
| researcherRulesAddress | address | Address of the ResearcherRules contract. |
| developerRulesAddress | address | Address of the DeveloperRules contract. |
| activistRulesAddress | address | Address of the ActivistRules contract. |
| contributorRulesAddress | address | Address of the ContributorRules contract. |

### invite

```solidity
function invite(address invited, enum CommunityTypes.UserType userType) external
```

Only most active users can invite new users to the system, respecting delay and type rules.

_Allows a user to attempt to invite another wallet to the community._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| invited | address | The address of the wallet to be invited. |
| userType | enum CommunityTypes.UserType | The user type to which the invited user will be assigned. |

### inviteRegeneratorInspector

```solidity
function inviteRegeneratorInspector(address invited, enum CommunityTypes.UserType userType) external
```

Activists can invite Regenerators or Inspectors to the system, respecting the specific activist delay.

_Allows an activist to invite Regenerators or Inspectors to the community._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| invited | address | The address of the wallet to be invited. |
| userType | enum CommunityTypes.UserType | The user type to which the invited user will be assigned (must be REGENERATOR or INSPECTOR). |

### onlyOwnerInvite

```solidity
function onlyOwnerInvite(address invited, enum CommunityTypes.UserType userType) public
```

The owner can invite any user type without delay or type restrictions.
If ownership is renounced, no wallet will be able to call this function.

_Allows the contract owner to invite a wallet to the community._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| invited | address | The address of the wallet to be invited. |
| userType | enum CommunityTypes.UserType | The user type to which the invited user will be assigned. |

### UserInvited

```solidity
event UserInvited(address inviter, address invited, enum CommunityTypes.UserType invitedType, uint256 blockNumber)
```

Event emitted when a user invites another.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the user who made the invitation. |
| invited | address | The address of the invited user. |
| invitedType | enum CommunityTypes.UserType | The user type assigned to the invited user. |
| blockNumber | uint256 | The block number at which the invitation was made. |

