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

The global total count of all active (non-`UNDEFINED`, non-`DENIED`) users in the system..

### invitations

```solidity
mapping(address => struct Invitation) invitations
```

A mapping from an invited user's address to their `Invitation` details.

### userTypesCount

```solidity
mapping(enum UserType => uint64) userTypesCount
```

A mapping to track the count of active users for each `UserType`.

### userTypesTotalCount

```solidity
mapping(enum UserType => uint64) userTypesTotalCount
```

A mapping to track the total count of registered users for each `UserType`,
including both active and `DENIED` users. This count serves as a global counter for new user IDs.

### userTypeSettings

```solidity
mapping(enum UserType => struct UserTypeSetting) userTypeSettings
```

A mapping storing specific settings for each `UserType`,
including proportionality rules, invitation requirements, and voter status.

### inviterPenalties

```solidity
mapping(address => uint16) inviterPenalties
```

Tracks the number of times an inviter has had their invitees denied.

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

### addDelation

```solidity
function addDelation(address addr, string title, string testimony) public
```

Allows registered users (excluding Supporters) to report other users or resources that may require invalidation.

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
| title | string | Title of the delation (max 100 characters). |
| testimony | string | Justification/details of the delation (Max characters). |

### addUser

```solidity
function addUser(address addr, enum UserType userType) public
```

Adds a new user to the system with a specified user type.

_This function can only be called by an allowed caller (e.g., specific *Rules contracts for each user type).
It enforces rules for single registration per address, valid user types, proportionality limits, and valid invitations if required._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the user to be registered. |
| userType | enum UserType | The desired `UserType` for the user. |

### addInvitation

```solidity
function addInvitation(address inviter, address invited, enum UserType userType) public
```

Attempts to add an invitation for a user.

_This function is intended to be called by an allowed caller, the Invitation Rules.
It records an invitation for a specific user to register as a certain user type.
Prevents re-inviting an already invited or registered address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the user who issued the invitation. |
| invited | address | The address of the user who received the invitation. |
| userType | enum UserType | The `UserType` the `invited` user is intended to register as. |

### setDeniedType

```solidity
function setDeniedType(address userAddress) public
```

Sets a user's type to `DENIED`.

_This function is intended to be called by an allowed caller (e.g., `ValidationRules`).
It decrements the count of the user's previous type and sets their `UserType` to `DENIED`.
Prevents re-denying an already denied user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user to be denied. |

### addInviterPenalty

```solidity
function addInviterPenalty(address inviter) public
```

This functions adds a penalty to users when a invited user gets denied.

_This function is intended to be called by an allowed caller (e.g., `ValidationRules`).
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
function getUser(address addr) public view returns (enum UserType)
```

Returns the `UserType` of a given address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum UserType | UserType The `UserType` enum value associated with the address. |

### getUserTypeSettings

```solidity
function getUserTypeSettings(enum UserType userType) public view returns (struct UserTypeSetting)
```

Returns the `UserTypeSetting` configuration for a specific `UserType`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum UserType | The `UserType` to query settings for. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct UserTypeSetting | UserTypeSetting The `UserTypeSetting` struct containing configuration data. |

### userTypeIs

```solidity
function userTypeIs(enum UserType userType, address userAddress) public view returns (bool)
```

Function to check if an userAddress type is equal passed userType

_True if userAddress is equal userType_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum UserType |  |
| userAddress | address | Denied user address |

### getUserDelations

```solidity
function getUserDelations(address addr) public view returns (struct Delation[])
```

_Returns the user address delated_

### getInvitation

```solidity
function getInvitation(address addr) public view returns (struct Invitation)
```

Get the invitation of an user

_Returns the invitation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | User address |

### UserRegistered

```solidity
event UserRegistered(address addr, enum UserType userType)
```

Emitted when a new user is successfully added to the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the newly registered user. |
| userType | enum UserType | The `UserType` assigned to the new user. |

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
event DelationAdded(address informer, address reported)
```

Emitted when a delation is successfully added.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| informer | address | The address of the user who submitted the delation. |
| reported | address | The address of the user being reported. |

### InvitationAdded

```solidity
event InvitationAdded(address inviter, address invited, enum UserType userTypeTo)
```

Emitted when an invitation is successfully added to the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the user who issued the invitation. |
| invited | address | The address of the user who received the invitation. |
| userTypeTo | enum UserType | The `UserType` the invited user is intended to register as. |

