# ICommunityRules

## ICommunityRules

Interface for the CommunityRules contract, which manages the rules for users.

### userTypesCount

```solidity
function userTypesCount(enum CommunityTypes.UserType userType) external view returns (uint256)
```

Returns the count of a specific user type.

_Getter for the public state variable `mapping(UserType => uint256) public userTypesCount`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The user type to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The count of users for that type. |

### userTypesTotalCount

```solidity
function userTypesTotalCount(enum CommunityTypes.UserType userType) external view returns (uint64)
```

Returns the total count of a user type (used for generating IDs).

_Getter for the public state variable `mapping(UserType => uint64) public userTypesTotalCount`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The user type to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64 | The total count for that type. |

### addUser

```solidity
function addUser(address user, enum CommunityTypes.UserType userType) external
```

Adds a new user to the system with a specific type.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the new user. |
| userType | enum CommunityTypes.UserType | The type to be assigned to the new user. |

### userTypeIs

```solidity
function userTypeIs(enum CommunityTypes.UserType userType, address user) external view returns (bool)
```

Checks if a user is of a specific type.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The user type to check against. |
| user | address | The address of the user to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool true if the user is of the specified type, false otherwise. |

### isDenied

```solidity
function isDenied(address user) external view returns (bool)
```

Checks if a user is denied.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool if the user is denied, so true, false otherwise. |

### getInvitation

```solidity
function getInvitation(address userAddress) external view returns (struct CommunityTypes.Invitation)
```

Gets the invitation data for a specific address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the invited user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CommunityTypes.Invitation | The Invitation struct containing the invitation data. |

### getUser

```solidity
function getUser(address account) external view returns (enum CommunityTypes.UserType)
```

Retrieves the UserType for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CommunityTypes.UserType | The user's UserType enum. |

### addInvitation

```solidity
function addInvitation(address inviter, address invitee, enum CommunityTypes.UserType userType) external
```

Adds a new invitation to the system.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The user who is sending the invitation. |
| invitee | address | The user who is being invited. |
| userType | enum CommunityTypes.UserType | The UserType being assigned in the invitation. |

### getUserTypeSettings

```solidity
function getUserTypeSettings(enum CommunityTypes.UserType userType) external view returns (struct CommunityTypes.UserTypeSetting)
```

Retrieves the settings configuration for a specific UserType.

_Returns a struct from which specific settings can be accessed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userType | enum CommunityTypes.UserType | The UserType for which to get the settings. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CommunityTypes.UserTypeSetting | The UserTypeSettings struct containing configuration data. |

### setToDenied

```solidity
function setToDenied(address account) external
```

Sets a user's type to a 'denied' or 'invalid' state.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the user to be denied. |

### votersCount

```solidity
function votersCount() external view returns (uint256)
```

Returns the total number of users eligible to vote.

_This might be a getter for a public state variable._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total count of voters. |

### isVoter

```solidity
function isVoter(address account) external view returns (bool)
```

Checks if a given account has voting rights.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the account is a voter, false otherwise. |

### addInviterPenalty

```solidity
function addInviterPenalty(address inviter) external
```

Function to add inviter penalties when invited user is denied.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inviter | address | The address of the account the inviter to receive penalty. |

### inviterPenalties

```solidity
function inviterPenalties(address addr) external view returns (uint16)
```

Returns the total count of invitation penalties of a user.

_Getter for the public state variable `mapping(address => uint16) public inviterPenalties`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The user address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint16 | The total count of penlaties for that user. |

