# ValidationRules

## ValidationRules

Responsible for reviewing and voting to invalidate users and resources.

_Manage validators rules and data. This contract is responsible for reviewing and voting to invalidate wrong or corrupted actions across different user types and resources._

### userValidations

```solidity
mapping(address => mapping(uint256 => uint256)) userValidations
```

The relationship between address and validations received by era.

### validatorLastVoteAt

```solidity
mapping(address => uint256) validatorLastVoteAt
```

Relationship between validator and last vote block.number.

### timeBetweenVotes

```solidity
uint256 timeBetweenVotes
```

Amount of blocks between votes.

### constructor

```solidity
constructor(uint256 timeBetweenVotes_) public
```

Initializes the ValidationRules contract with a minimum time between votes.

_Sets the immutable `timeBetweenVotes` which dictates how many blocks a validator must wait between votes._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timeBetweenVotes_ | uint256 | The number of blocks a validator must wait between consecutive votes. |

### setContractAddressDependencies

```solidity
function setContractAddressDependencies(struct ContractsDependency contractDependency) public
```

_onlyOwner function to set contracts dependency. This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractDependency | struct ContractsDependency | Addresses of system contracts used. |

### addUserValidation

```solidity
function addUserValidation(address userAddress, string justification) public
```

Allows users to attempt to vote to invalidate an user.

_Votes to invalidate users with unwanted behavior.

Requirements:
- The caller must be a registered voter user (verified by VoteRules).
- Caller level must be above average (verified by VoteRules.canVote implicitly).
- Caller must have waited `timeBetweenVotes` since their last vote.
- Caller must vote only once per user per era.
- The target user must be registered and not already denied._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | Invalidation user address. |
| justification | string | Invalidation justification (Max characters). |

### addInspectionValidation

```solidity
function addInspectionValidation(struct Inspection inspection, string justification, address validatorAddress) public
```

Allows allowed callers (e.g., InspectorRules) to record a validation vote against an inspection.

_This function is intended to be called by the `InspectionRules` contract.
It records a validation vote for an inspection and applies penalties if enough votes accumulate.

Requirements:
- Caller must be an allowed contract (via `mustBeAllowedCaller`).
- The validator address must not have already voted for this specific inspection._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspection | struct Inspection | Inspection data. |
| justification | string | Invalidation justification. |
| validatorAddress | address | Address of the voter. |

### addReportValidation

```solidity
function addReportValidation(struct Report report, string justification, address validatorAddress) public
```

Allows allowed callers (e.g., DeveloperRules) to record a validation vote against a report.

_This function is intended to be called by the `DeveloperRules` contract.
It records a validation vote for a report and applies penalties if enough votes accumulate.

Requirements:
- Caller must be an allowed contract (via `mustBeAllowedCaller`).
- The validator address must not have already voted for this specific report._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| report | struct Report | Report data. |
| justification | string | Invalidation justification. |
| validatorAddress | address | Address of the voter. |

### addContributionValidation

```solidity
function addContributionValidation(struct Contribution contribution, string justification, address validatorAddress) public
```

Allows allowed callers (e.g., ContributorRules) to record a validation vote against a contribution.

_This function is intended to be called by the `ContributorRules` contract.
It records a validation vote for a contribution and applies penalties if enough votes accumulate.

Requirements:
- Caller must be an allowed contract (via `mustBeAllowedCaller`).
- The validator address must not have already voted for this specific contribution._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contribution | struct Contribution | Contribution data. |
| justification | string | Invalidation justification. |
| validatorAddress | address | Address of the voter. |

### addResearchValidation

```solidity
function addResearchValidation(struct Research research, string justification, address validatorAddress) public
```

Allows allowed callers (e.g., ResearcherRules) to record a validation vote against a research.

_This function is intended to be called by the `ResearcherRules` contract.
It records a validation vote for a research and applies penalties if enough votes accumulate.

Requirements:
- Caller must be an allowed contract (via `mustBeAllowedCaller`).
- The validator address must not have already voted for this specific research._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| research | struct Research | Research data. |
| justification | string | Invalidation justification. |
| validatorAddress | address | Address of the voter. |

### getUserValidations

```solidity
function getUserValidations(address userAddress, uint256 currentEra) public view returns (uint256)
```

Get all user validations for a specific user in a given era.

_Retrieves an array of `UserValidation` structs for a specified user and era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user. |
| currentEra | uint256 | The era to check for validations. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | UserValidation[] An array of `UserValidation` structs. |

### votesToInvalidate

```solidity
function votesToInvalidate() public view returns (uint256 count)
```

Get how many validations is necessary to invalidate a user or resource.

_Calculates the required number of votes for invalidation based on the total number of registered voters in the system.
Calculation is based on the `votersCount` which includes activists, researchers, developers, and contributors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | Number of votes required for invalidation. |

### waitedTimeBetweenVotes

```solidity
function waitedTimeBetweenVotes(address validatorAddress) public view returns (bool)
```

Check if a validator can vote based on their last vote block number and `timeBetweenVotes`.

_Returns true if the current block number is past `validatorLastVoteAt` + `timeBetweenVotes`,
or if the validator has never voted before._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| validatorAddress | address | The address of the validator. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the validator can vote, false otherwise. |

### UserValidation

```solidity
event UserValidation(address _validatorAddress, address _userAddress, string _justification)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _userAddress | address | The wallet of the user receiving the vote. |
| _justification | string | The justification provided for the vote. |

### InspectionValidation

```solidity
event InspectionValidation(address _validatorAddress, uint256 _resourceId, string _justification)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _resourceId | uint256 | The id of the resource receiving the vote. |
| _justification | string | The justification provided for the vote. |

### ReportValidation

```solidity
event ReportValidation(address _validatorAddress, uint256 _resourceId, string _justification)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _resourceId | uint256 | The id of the resource receiving the vote. |
| _justification | string | The justification provided for the vote. |

### ContributionValidation

```solidity
event ContributionValidation(address _validatorAddress, uint256 _resourceId, string _justification)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _resourceId | uint256 | The id of the resource receiving the vote. |
| _justification | string | The justification provided for the vote. |

### ResearchValidation

```solidity
event ResearchValidation(address _validatorAddress, uint256 _resourceId, string _justification)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _resourceId | uint256 | The id of the resource receiving the vote. |
| _justification | string | The justification provided for the vote. |

### UserDenied

```solidity
event UserDenied(address _userAddress)
```

Emitted when a user is successfully invalidated and denied.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _userAddress | address | The address of the user who was denied. |

### ResourceInvalidated

```solidity
event ResourceInvalidated(string _resourceType, uint256 _resourceId, address _ownerAddress, uint256 _penaltiesAdded)
```

Emitted when a resource (Inspection, Report, Contribution, Research) is processed after accumulating enough invalidation votes.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _resourceType | string | The type of resource being processed (e.g., "Inspection", "Report"). |
| _resourceId | uint256 | The ID of the resource. |
| _ownerAddress | address | The address of the user who created the invalidated resource. |
| _penaltiesAdded | uint256 | The number of penalties added to the owner. |

