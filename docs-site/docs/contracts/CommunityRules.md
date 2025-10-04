# CommunityRules

## CommunityRules

This contract serves as the central registry for user management within the community.
It manages user types, registration processes, invitation mechanisms, and a delation system for reporting unwanted behavior.

_Inherits from `Ownable` for deploy setup and `Callable` for restricting access to sensitive functions
to whitelisted addresses. It defines critical parameters and logic for user onboarding and community governance._

### SUPPORTER_INVITATION_DELAY_BLOCKS

```solidity
uint32 SUPPORTER_INVITATION_DELAY_BLOCKS
```

The number of blocks an invitation is delayed for Supporters.

### VOTER_INVITATION_DELAY_BLOCKS

```solidity
uint32 VOTER_INVITATION_DELAY_BLOCKS
```

The number of blocks an invitation is delayed for voter-type users.

### delationsCount

```solidity
uint64 delationsCount
```

Total count of delations received across all users.

### usersCount

```solidity
uint64 usersCount
```

The global total count of all active (non-`UNDEFINED`) users in the system..

### delationsById

```solidity
mapping(uint256 => struct CommunityTypes.Delation) delationsById
```

A mapping from a delation id to the `Delation` struct.

### invitations

```solidity
mapping(address => struct CommunityTypes.Invitation) invitations
```

A mapping from an invited user's address to their `Invitation` details.

### userTypesCount

```solidity
mapping(enum CommunityTypes.UserType => uint64) userTypesCount
```

A mapping to track the count of active users for each `UserType`.

### userTypesTotalCount

```solidity
mapping(enum CommunityTypes.UserType => uint64) userTypesTotalCount
```

A mapping to track the total count of registered users for each `UserType`,
including both active and `DENIED` users. This count serves as a global counter for new user IDs.

### userTypeSettings

```solidity
mapping(enum CommunityTypes.UserType => struct CommunityTypes.UserTypeSetting) userTypeSettings
```

A mapping storing specific settings for each `UserType`,
including proportionality rules, invitation requirements, and voter status.

### inviterPenalties

```solidity
mapping(address => uint16) inviterPenalties
```

Tracks the number of times an inviter has had their invitees denied.

### lastDelationBlock

```solidity
mapping(address => uint256) lastDelationBlock
```

Tracks the block number of each user's last submitted delation.

### invitationRulesAddress

```solidity
address invitationRulesAddress
```

The address of the `InvitationRules` contract.

### validationRulesAddress

```solidity
address validationRulesAddress
```

The address of the `InvitationRules` contract.

### constructor

```solidity
constructor(uint8 inspectorProportionality, uint8 activistProportionality, uint8 researcherProportionality, uint8 developerProportionality, uint8 contributorProportionality) public
```

Initializes the CommunityRules contract by setting up initial proportionality and invitation rules for various user types.

_Sets predefined `UserTypeSetting` for Regenerators, Inspectors, Activists, Researchers, Developers, and Contributors._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectorProportionality | uint8 | Defines the proportionality ratio for Inspector registration. |
| activistProportionality | uint8 | Defines the proportionality ratio for Activist registration. |
| researcherProportionality | uint8 | Defines the proportionality ratio for Researcher registration. |
| developerProportionality | uint8 | Defines the proportionality ratio for Developer registration. |
| contributorProportionality | uint8 | Defines the proportionality ratio for Contributor registration. |

### setContractCall

```solidity
function setContractCall(address _invitationRulesAddress, address _validationRulesAddress) external
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _invitationRulesAddress | address | Address of InvitationRules. |
| _validationRulesAddress | address | Address of ValidationRules. |

### addDelation

```solidity
function addDelation(address addr, string title, string testimony) external
```

Allows registered users (excluding Supporters) to report other users or resources that may require invalidation.
Limited to one delation per target.

Examples of unwanted behavior:

- A user voting to invalidate a valid resource
- User without valid proofPhoto
- Inspections without valid proofPhoto
- Inspections without valid justification report
- Resources without valid justifications report
- Inactive users

_Adds a new delation to the system. Enforces character limits for title and testimony, and requires both reporter and reported user to be registered._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user being reported. |
| title | string | Title of the delation (Max 100 characters). |
| testimony | string | Justification/details of the delation (Max 300 characters). |

### voteOnDelation

```solidity
function voteOnDelation(uint64 _delationId, bool _supportsDelation) external
```

Allows users to vote (true/false) on an existing delation.

_This creates a social validation layer. Voters cannot be the informer or the reported user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _delationId | uint64 | The ID of the delation to vote on. |
| _supportsDelation | bool | True for a "thumbs up" (agrees), false for "thumbs down" (disagrees). |

### addUser

```solidity
function addUser(address addr, enum CommunityTypes.UserType userType) external
```

Adds a new user to the system with a specified user type.

_This function can only be called by an allowed caller (e.g., specific *Rules contracts for each user type).
It enforces rules for single registration per address, valid user types, proportionality limits, and valid invitations if required._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user to be registered. |
| userType | enum CommunityTypes.UserType | The desired `UserType` for the user. |

### addInvitation

```solidity
function addInvitation(address inviter, address invited, enum CommunityTypes.UserType userType) external
```

Attempts to add an invitation for a new user.

_This function is intended to be called by an allowed caller, the Invitation Rules.
It records an invitation for a specific user to register as a certain user type.
Prevents re-inviting an already invited or registered address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the user who issued the invitation. |
| invited | address | The address of the user who received the invitation. |
| userType | enum CommunityTypes.UserType | The `UserType` the `invited` user is intended to register as. |

### setToDenied

```solidity
function setToDenied(address userAddress) external
```

Sets a user's to `DENIED`.

_This function is intended to be called by an allowed caller (`ValidationRules`).
It decrements the count of the user's previous type and sets their `UserType` to `DENIED`.
Prevents re-denying an already denied user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user to be denied. |

### addInviterPenalty

```solidity
function addInviterPenalty(address inviter) external
```

This functions adds a penalty to users when a invited user gets denied.

_This function is intended to be called by an allowed caller (`ValidationRules`).
It decrements the count of penalties for the inviter._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the inviter receiving the penalty. |

### votersCount

```solidity
function votersCount() public view returns (uint256)
```

Returns the total count of users currently classified as voters.

_Sums the active counts of Activist, Contributor, Developer, and Researcher user types._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total number of voters. |

### isVoter

```solidity
function isVoter(address addr) public view returns (bool)
```

Checks if a given address belongs to a user type that is considered a voter.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the user is a voter, false otherwise. |

### getUser

```solidity
function getUser(address addr) public view returns (enum CommunityTypes.UserType)
```

Returns the `UserType` of a given address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CommunityTypes.UserType | UserType The `UserType` enum value associated with the address. |

### getUserTypeSettings

```solidity
function getUserTypeSettings(enum CommunityTypes.UserType userType) public view returns (struct CommunityTypes.UserTypeSetting)
```

Returns the `UserTypeSetting` configuration for a specific `UserType`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The `UserType` to query settings for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CommunityTypes.UserTypeSetting | UserTypeSetting The `UserTypeSetting` struct containing configuration data. |

### userTypeIs

```solidity
function userTypeIs(enum CommunityTypes.UserType userType, address userAddress) public view returns (bool)
```

Function to check if an userAddress type is equal passed userType.

_This function also checks if a user is denied, returning false if denied._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The `UserType` to check for. |
| userAddress | address | Denied user address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if userAddress is equal userType. |

### isDenied

```solidity
function isDenied(address userAddress) public view returns (bool)
```

Function to check if an userAddress is denied.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if userAddress is denied. |

### getUserDelations

```solidity
function getUserDelations(address _user) external view returns (uint64[])
```

Gets the unique IDs of all delations filed against a user.

_This function returns an array of IDs. The full data for each delation
can then be fetched individually from the public `delationsById` mapping._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address of the user whose delation IDs are to be retrieved. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64[] | An array of `uint64` delation IDs. |

### getInvitation

```solidity
function getInvitation(address addr) external view returns (struct CommunityTypes.Invitation)
```

Get the invitation of a user.

_Returns the invitation._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | User address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CommunityTypes.Invitation | the Invitation data struct. |

### hasWaitedRequiredTime

```solidity
function hasWaitedRequiredTime(address addr) public view returns (bool)
```

_Calculates if a user is eligible to publish a delation.
Eligibility based on the `lastDelationBlock` and `BLOCKS_BETWEEN_DELATIONS`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the user can publish, `false` otherwise. |

### UserRegistered

```solidity
event UserRegistered(address addr, enum CommunityTypes.UserType userType)
```

Emitted when a new user is successfully added to the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the newly registered user. |
| userType | enum CommunityTypes.UserType | The `UserType` assigned to the new user. |

### DeniedUserEvent

```solidity
event DeniedUserEvent(address addr)
```

Emitted when a user's type is changed to `DENIED`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user who has been denied. |

### DelationAdded

```solidity
event DelationAdded(address informer, address reported, uint64 newDelationId)
```

Emitted when a delation is successfully added.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| informer | address | The address of the user who submitted the delation. |
| reported | address | The address of the user being reported. |
| newDelationId | uint64 |  |

### InvitationAdded

```solidity
event InvitationAdded(address inviter, address invited, enum CommunityTypes.UserType userTypeTo)
```

Emitted when an invitation is successfully added to the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the user who issued the invitation. |
| invited | address | The address of the user who received the invitation. |
| userTypeTo | enum CommunityTypes.UserType | The `UserType` the invited user is intended to register as. |

### DelationVoted

```solidity
event DelationVoted(uint64 delationId, address voter, bool supportsDelation, uint256 newThumbsUpCount, uint256 newThumbsDownCount)
```

Emitted when a user votes on a delation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delationId | uint64 | The ID of the delation that was voted on. |
| voter | address | The address of the user who voted. |
| supportsDelation | bool | True if the vote was a "thumbs up", false for "thumbs down". |
| newThumbsUpCount | uint256 | The new total of "thumbs up" votes for this delation. |
| newThumbsDownCount | uint256 | The new total of "thumbs down" votes for this delation. |

