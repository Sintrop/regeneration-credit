# ContributorRules

## ContributorRules

This contract defines and manages the rules and data specific to "Contributor" users
within the system. Contributors perform generic contributions to the project and are subject
to validation and penalty mechanisms.

_Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
for general user management, `ContributorPool` for reward distribution, `VoteRules` for voting
eligibility, and `ValidationRules` for contribution validation processes._

### MAX_USER_COUNT

```solidity
uint16 MAX_USER_COUNT
```

Maximum users count allowed for this UserType.

### maxPenalties

```solidity
uint8 maxPenalties
```

The maximum number of penalties a contributor can accumulate before being denied.

### timeBetweenWorks

```solidity
uint32 timeBetweenWorks
```

The minimum number of blocks that must elapse between contribution publications.
This prevents spamming or rapid consecutive contributions.

### securityBlocksToValidation

```solidity
uint32 securityBlocksToValidation
```

The number of blocks before the end of an era during which no new contributions can be published.
This period allows validators sufficient time to analyze and vote on contributions before the era concludes.

### contributionsCount

```solidity
uint64 contributionsCount
```

The total count of contributions that are currently considered valid (not invalidated).

### contributionsTotalCount

```solidity
uint64 contributionsTotalCount
```

The total count of all contributions ever submitted, including invalidated ones.
This acts as a global unique ID counter for new contributions.

### totalActiveLevels

```solidity
uint256 totalActiveLevels
```

The sum of all active levels from valid contributions by non-denied contributors.

### contributions

```solidity
mapping(uint256 => struct Contribution) contributions
```

A mapping from a unique contribution ID to its detailed `Contribution` data structure.
Stores all submitted contributions.

### contributorsAddress

```solidity
mapping(uint256 => address) contributorsAddress
```

A mapping from a unique contributor ID to their corresponding wallet address.
Facilitates lookup of a contributor's address by their ID.

### contributionsIds

```solidity
mapping(address => uint256[]) contributionsIds
```

A mapping from a contributor's wallet address to an array of IDs of contributions they have made.

### contributionPenalized

```solidity
mapping(uint64 => bool) contributionPenalized
```

Tracks contribution IDs that have already been invalidated.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The interface of the `CommunityRules` contract, used to interact with
community-wide rules, user types, and invitation data.

### contributorPool

```solidity
contract IContributorPool contributorPool
```

The interface of the `ContributorPool` contract, responsible for managing
and distributing token rewards to contributors.

### validationRules

```solidity
contract IValidationRules validationRules
```

The interface of the `ValidationRules` contract, which defines the rules
and processes for validating or invalidating contributions.

### voteRules

```solidity
contract IVoteRules voteRules
```

The interface of the `VoteRules` contract, which defines rules for user voting
eligibility, particularly for contribution validation.

### validationRulesAddress

```solidity
address validationRulesAddress
```

The address of the `InspectionRules` contract.

### penalties

```solidity
mapping(address => struct Penalty[]) penalties
```

A mapping from a contributor's wallet address to an array of `Penalty` structs they have received.

### constructor

```solidity
constructor(uint32 timeBetweenWorks_, uint8 maxPenalties_, uint32 securityBlocksToValidation_) public
```

_Initializes the ContributorRules contract with key parameters for contribution management.
Note: External contract addresses (`communityRules`, `contributorPool`, etc.) are set via `setContractInterfaces`
after deployment, following an `onlyOwner` pattern for secure initialization._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timeBetweenWorks_ | uint32 | The required blocks between contributions. |
| maxPenalties_ | uint8 | The maximum allowed penalties for a contributor. |
| securityBlocksToValidation_ | uint32 | The number of blocks before era end to block new contributions. |

### setContractInterfaces

```solidity
function setContractInterfaces(struct ContractsDependency contractDependency) external
```

_onlyOwner function to set contract interfaces.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractDependency | struct ContractsDependency | Addresses of system contracts used. |

### setContractCall

```solidity
function setContractCall(address _validationRulesAddress) external
```

_onlyOwner function to set contract interfaces.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validationRulesAddress | address | Address of ValidationRules. |

### addContributor

```solidity
function addContributor(string name, string proofPhoto) external
```

Users must meet specific criteria (previous invitation, system vacancies)
to successfully register as a contributor.

Requirements:
- The caller (`msg.sender`) must not already be a registered contributor.
- The `name` string must not exceed 50 characters in byte length.
- The `proofPhoto` string must not exceed 150 characters in byte length.
- The total number of `CONTRIBUTOR` users in the system must not exceed 16,000.

_Allows a user to attempt to register as a contributor.
Creates a new `Contributor` profile for the caller if all requirements are met._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The chosen name for the contributor. |
| proofPhoto | string | A hash or identifier for the contributor's identity verification photo. |

### addContribution

```solidity
function addContribution(string description, string report) external
```

Contributions can only be published if certain time conditions and user type requirements are met.

Requirements:
- The `description` string must not exceed 300 characters in byte length.
- The `report` hash/identifier string must not exceed 150 characters in byte length.
- The caller (`msg.sender`) must be a registered `CONTRIBUTOR`.
- The current block number must be greater than `securityBlocksToValidation` blocks away
from the end of the current era (not within the security window).
- The contributor must be eligible to publish based on `timeBetweenWorks` (checked via `canPublishContribution`).

_Allows a contributor to attempt to publish a new contribution report._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| description | string | A title or brief description of the contribution. |
| report | string | A hash or identifier (e.g., IPFS CID) of the detailed report file. |

### addContributionValidation

```solidity
function addContributionValidation(uint64 id, string justification) external
```

Only authorized validators can initiate this process after meeting specific requirements.

Requirements:
- The `justification` string must not exceed 300 characters in byte length.
- The caller (`msg.sender`) must be eligible to vote (checked via `voteRules.canVote`).
- The caller must have waited the required `timeBetweenVotes` (checked via `validationRules.waitedTimeBetweenVotes`).
- The target `contribution` must exist and be currently valid, and its era must be the current era or a past one.

_Allows a validator to cast a vote to invalidate a specific contribution.
This process increments the validation count for the contribution and may trigger its invalidation._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The unique ID of the contribution to be validated/invalidated. |
| justification | string | A string explaining why the contribution is being invalidated. |

### withdraw

```solidity
function withdraw() external
```

Contributors can claim tokens for their contribution service.

Requirements:
- The caller (`msg.sender`) must be a registered `CONTRIBUTOR`.
- The contributor must be eligible for withdrawal in their current era (checked via `contributorPool.canWithdraw`).
- The contributor's current era (`contributor.pool.currentEra`) will be incremented upon successful withdrawal attempt.

_Allows a contributor to initiate a withdrawal of Regeneration Credits
based on their published contributions and current era._

### removePoolLevels

```solidity
function removePoolLevels(address addr) external
```

Can only be called by ValidationRules address.

_Allows an authorized caller to remove levels from a contributor's pool.
This function updates the contributor's local level if user is not being denied and
notifies the `ContributorPool` contract to remove the pool level._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the contributor from whom levels are to be removed. |

### getContributor

```solidity
function getContributor(address addr) public view returns (struct Contributor contributor)
```

Provides the full profile of a contributor.

_Returns the detailed `Contributor` data for a given address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the contributor to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributor | struct Contributor | The `Contributor` struct containing the user's data. |

### getContribution

```solidity
function getContribution(uint64 id) public view returns (struct Contribution)
```

Provides the full details of a specific contribution.

_Returns the detailed `Contribution` data for a given contribution ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The unique ID of the contribution to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Contribution | Contribution The `Contribution` struct containing the contribution's data. |

### getContributionsIds

```solidity
function getContributionsIds(address addr) public view returns (uint256[])
```

Provides a list of all contributions made by a given user.

_Returns an array of IDs of the contributions made by a specific address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the contributor whose contributions are to be retrieved. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | uint256[] An array of contribution IDs. |

### canSendInvite

```solidity
function canSendInvite(address addr) public view returns (bool)
```

Returns `true` if the contributor can send an invite, `false` otherwise.

_Checks if a specific contributor address is eligible to send new invitations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the contributor to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the contributor is eligible to send an invite, `false` otherwise. |

### totalPenalties

```solidity
function totalPenalties(address addr) public view returns (uint256)
```

Provides the current penalty count for a specific contributor.

_Returns the total number of penalties an address has accumulated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The contributor's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total number of penalties for the given address. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

This function provides the current era from the perspective of the reward pool.

_Returns the current era as determined by the `ContributorPool` contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current era of the `ContributorPool`. |

### canPublishContribution

```solidity
function canPublishContribution(address addr) public view returns (bool)
```

This function determines if a contributor has waited the required time since their last publication.

_Checks if a user can publish a new contribution based on `timeBetweenWorks`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the contributor to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the contributor can publish a contribution, `false` otherwise. |

### nextEraIn

```solidity
function nextEraIn() public view returns (uint256)
```

Provides a countdown to the next era for contribution planning.

_Calculates the number of blocks remaining until the start of the next era,
according to the `ContributorPool` contract's era definition._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The amount of blocks remaining until the next era begins. |

### ContributorRegistered

```solidity
event ContributorRegistered(uint256 id, address contributorAddress, string name, uint256 blockNumber)
```

_Emitted when a new contributor successfully registers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the newly registered contributor. |
| contributorAddress | address | The wallet address of the contributor. |
| name | string | The name provided by the contributor. |
| blockNumber | uint256 | The block number at which the registration occurred. |

### ContributionAdded

```solidity
event ContributionAdded(uint256 id, address contributorAddress, string description, uint256 blockNumber)
```

_Emitted when a new contribution is successfully added by a contributor._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the new contribution. |
| contributorAddress | address | The address of the contributor who submitted the contribution. |
| description | string | The description/title of the contribution. |
| blockNumber | uint256 | The block number at which the contribution was added. |

### ContributionInvalidated

```solidity
event ContributionInvalidated(uint64 contributionId, address contributorAddress, string justification, uint256 newPenaltyCount, uint256 blockNumber)
```

_Emitted when a contribution is officially invalidated after reaching the required votes.
This event signifies a final state change for the contribution._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributionId | uint64 | The ID of the contribution that was invalidated. |
| contributorAddress | address | The address of the contributor of the invalidated contribution. |
| justification | string | The justification provided by the validator who triggered the invalidation (last vote). |
| newPenaltyCount | uint256 | The total number of penalties the contributor now has. |
| blockNumber | uint256 | The block number at which the contribution was invalidated. |

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

### ContributorWithdrawalInitiated

```solidity
event ContributorWithdrawalInitiated(address contributorAddress, uint256 era, uint256 blockNumber)
```

_Emitted when a contributor successfully initiates a withdrawal of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributorAddress | address | The address of the contributor initiating the withdrawal. |
| era | uint256 | The era for which the withdrawal was initiated. |
| blockNumber | uint256 | The block number at which the withdrawal was initiated. |

### ContributorLevelIncreased

```solidity
event ContributorLevelIncreased(address contributorAddress, uint256 newLevel, uint256 blockNumber)
```

_Emitted when a contributor's level is increased._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributorAddress | address | The address of the contributor whose level was increased. |
| newLevel | uint256 | The new total level of the contributor. |
| blockNumber | uint256 | The block number at which the level increase occurred. |

