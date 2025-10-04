# DeveloperRules

## DeveloperRules

This contract defines and manages the rules and data specific to "Developer" users
within the system. Developers are primarily responsible for the development of the project
through submitting development reports, which are subject to validation and penalty mechanisms.

_Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
for general user management, `DeveloperPool` for reward distribution, `VoteRules` for voting
eligibility, and `ValidationRules` for report validation processes._

### MAX_USER_COUNT

```solidity
uint16 MAX_USER_COUNT
```

Maximum users count allowed for this UserType.

### maxPenalties

```solidity
uint8 maxPenalties
```

The maximum number of penalties a developer can accumulate before facing invalidation.

### timeBetweenWorks

```solidity
uint32 timeBetweenWorks
```

The minimum number of blocks that must elapse between a developer's successful report publications.
This prevents spamming or rapid consecutive report submissions.

### securityBlocksToValidation

```solidity
uint32 securityBlocksToValidation
```

The number of blocks before the end of an era during which no new reports can be published.
This period allows validators sufficient time to analyze and vote on reports before the era concludes.

### reportsCount

```solidity
uint64 reportsCount
```

The total count of development reports that are currently considered valid (not invalidated).

### reportsTotalCount

```solidity
uint64 reportsTotalCount
```

The grand total count of all development reports ever submitted, including invalidated ones.
This acts as a global unique ID counter for new reports.

### totalActiveLevels

```solidity
uint256 totalActiveLevels
```

The sum of all active levels from valid reports by non-denied developers.

### reports

```solidity
mapping(uint256 => struct Report) reports
```

A mapping from a unique report ID to its detailed `Report` data structure.
Stores all submitted development reports.

### reportsIds

```solidity
mapping(address => uint256[]) reportsIds
```

A mapping from a developer's wallet address to an array of IDs of reports they have submitted.

### penalties

```solidity
mapping(address => struct Penalty[]) penalties
```

A mapping from a developer's wallet address to an array of `Penalty` structs they have received.

### developersAddress

```solidity
mapping(uint256 => address) developersAddress
```

A mapping from a unique developer ID to their corresponding wallet address.
Facilitates lookup of a developer's address by their ID.

### reportPenalized

```solidity
mapping(uint64 => bool) reportPenalized
```

Tracks report IDs that have already been invalidated.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The interface of the `CommunityRules` contract, used to interact with
community-wide rules, user types, and invitation data.

### developerPool

```solidity
contract IDeveloperPool developerPool
```

The interface of the `DeveloperPool` contract, responsible for managing
and distributing token rewards to developers.

### validationRules

```solidity
contract IValidationRules validationRules
```

The interface of the `ValidationRules` contract, which defines the rules
and processes for validating or invalidating development reports.

### voteRules

```solidity
contract IVoteRules voteRules
```

The interface of the `VoteRules` contract, which defines rules for user voting
eligibility, particularly for report validation.

### validationRulesAddress

```solidity
address validationRulesAddress
```

The address of the `InspectionRules` contract.

### constructor

```solidity
constructor(uint32 timeBetweenWorks_, uint8 maxPenalties_, uint32 securityBlocksToValidation_) public
```

_Initializes the DeveloperRules contract with key parameters for report management.
Note: External contract addresses (`communityRules`, `developerPool`, etc.) are set via `setContractInterfaces`
after deployment, following an `onlyOwner` pattern for secure initialization._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timeBetweenWorks_ | uint32 | The required blocks between report publications. |
| maxPenalties_ | uint8 | The maximum allowed penalties for a developer. |
| securityBlocksToValidation_ | uint32 | The number of blocks before era end to block new report submissions. |

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

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validationRulesAddress | address | Address of ValidationRules. |

### addDeveloper

```solidity
function addDeveloper(string name, string proofPhoto) external
```

Users must meet specific criteria (previous invitation, system vacancies)
to successfully register as a developer.

Requirements:
- The caller (`msg.sender`) must not already be a registered developer.
- The `name` string must not exceed 50 characters in byte length.
- The `proofPhoto` string must not exceed 150 characters in byte length.
- The total number of `DEVELOPER` users in the system must not exceed 16,000.

_Allows a user to attempt to register as a developer.
Creates a new `Developer` profile for the caller if all requirements are met._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The chosen name for the developer. |
| proofPhoto | string | A hash or identifier (e.g., URL) for the developer's identity verification photo. |

### addReport

```solidity
function addReport(string description, string report) external
```

Development reports can only be published if certain time conditions and user type requirements are met.

Requirements:
- The `description` string must not exceed 300 characters in byte length.
- The `report` hash/identifier string must not exceed 150 characters in byte length.
- The caller (`msg.sender`) must be a registered `DEVELOPER`.
- The current block number must be greater than `securityBlocksToValidation` blocks away
from the end of the current era (i.e., not within the security window).
- The developer must be eligible to publish based on `timeBetweenWorks` (checked via `canPublishReport`).

_Allows a developer to attempt to publish a new development report._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| description | string | A title or brief description of the report. |
| report | string | A hash or identifier (e.g., IPFS CID) of the detailed development report file. |

### addReportValidation

```solidity
function addReportValidation(uint64 id, string justification) external
```

Only authorized validators can initiate this process after meeting specific time requirements.

Requirements:
- The `justification` string must not exceed 300 characters in byte length.
- The caller (`msg.sender`) must be eligible to vote (checked via `voteRules.canVote`).
- The caller must have waited the required `timeBetweenVotes` (checked via `validationRules.waitedTimeBetweenVotes`).
- The target `report` must exist and be currently valid, and its era must be the current era or a past one.

_Allows a validator to vote to invalidate a specific development report.
This process increments the validation count for the report and may trigger its invalidation._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The unique ID of the report to be validated/invalidated. |
| justification | string | A string explaining why the report is being invalidated. |

### withdraw

```solidity
function withdraw() external
```

Developers can claim tokens for their development service.

Requirements:
- The caller (`msg.sender`) must be a registered `DEVELOPER`.
- The developer must be eligible for withdrawal in their current era (checked via `developerPool.canWithdraw`).
- The developer's current era (`developer.pool.currentEra`) will be incremented upon successful withdrawal attempt.

_Allows a developer to initiate a withdrawal of Regeneration Credits
based on their published reports and current era._

### removePoolLevels

```solidity
function removePoolLevels(address addr) external
```

Can only be called by whitelisted addresses, the ValidatorRules contract.

_Allows an authorized caller to remove levels from a developer's pool.
This function updates the developer's local level and notifies the `DeveloperPool` contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the developer from whom levels are to be removed. |

### canSendInvite

```solidity
function canSendInvite(address addr) public view returns (bool)
```

Only most active users _canSendInvite.

_Checks if a specific developer address is eligible to send new invitations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the developer to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the developer is eligible to send an invite, `false` otherwise. |

### getDeveloper

```solidity
function getDeveloper(address addr) public view returns (struct Developer developer)
```

Provides the full profile of a developer.

_Returns a developer's detailed profile._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the developer to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| developer | struct Developer | The `Developer` struct containing the user's data. |

### getReport

```solidity
function getReport(uint64 id) public view returns (struct Report)
```

Provides the full details of a specific development report.

_Returns the detailed `Report` data for a given report ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The unique ID of the report to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Report | Report The `Report` struct containing the report's data. |

### getReportsIds

```solidity
function getReportsIds(address addr) public view returns (uint256[])
```

Provides a list of all reports submitted by a given user.

_Returns an array of IDs of the reports made by a specific address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the developer whose reports are to be retrieved. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | uint256[] An array of report IDs. |

### totalPenalties

```solidity
function totalPenalties(address addr) public view returns (uint256)
```

Provides the current penalty count for a specific developer.

_Returns the total number of penalties an address has accumulated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The developer's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total number of penalties for the given address. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

This function provides the current era from the perspective of the reward pool,
essential for era-based eligibility and reward calculations for developers.

_Returns the current era as determined by the `DeveloperPool` contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current era of the `DeveloperPool`. |

### canPublishReport

```solidity
function canPublishReport(address addr) public view returns (bool)
```

This function determines if a developer has waited the required time since their last publication.

_Checks if a user can publish a new report based on `timeBetweenWorks`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the developer to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the developer can publish a report, `false` otherwise. |

### nextEraIn

```solidity
function nextEraIn() public view returns (uint256)
```

Provides a countdown to the next era for report planning.

_Calculates the number of blocks remaining until the start of the next era,
according to the `DeveloperPool` contract's era definition._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The amount of blocks remaining until the next era begins. |

### DeveloperRegistered

```solidity
event DeveloperRegistered(uint256 id, address developerAddress, string name, uint256 blockNumber)
```

_Emitted when a new developer successfully registers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the newly registered developer. |
| developerAddress | address | The wallet address of the developer. |
| name | string | The name provided by the developer. |
| blockNumber | uint256 | The block number at which the registration occurred. |

### ReportAdded

```solidity
event ReportAdded(uint256 id, address developerAddress, string description, uint256 blockNumber)
```

_Emitted when a new development report is successfully added by a developer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the new report. |
| developerAddress | address | The address of the developer who submitted the report. |
| description | string | The description/title of the report. |
| blockNumber | uint256 | The block number at which the report was added. |

### ReportInvalidated

```solidity
event ReportInvalidated(uint64 reportId, address developerAddress, string justification, uint256 newPenaltyCount, uint256 blockNumber)
```

_Emitted when a development report is officially invalidated after reaching the required votes.
This event signifies a final state change for the report._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reportId | uint64 | The ID of the report that was invalidated. |
| developerAddress | address | The address of the developer of the invalidated report. |
| justification | string | The justification provided by the validator who triggered the invalidation (last vote). |
| newPenaltyCount | uint256 | The total number of penalties the developer now has. |
| blockNumber | uint256 | The block number at which the report was invalidated. |

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

### PenaltyAdded

```solidity
event PenaltyAdded(address developerAddress, uint256 associatedReportId, uint256 blockNumber)
```

_Emitted when a penalty is added to a developer's record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| developerAddress | address | The address of the developer who received the penalty. |
| associatedReportId | uint256 | The ID of the report linked to this penalty. |
| blockNumber | uint256 | The block number at which the penalty was added. |

### DeveloperWithdrawalInitiated

```solidity
event DeveloperWithdrawalInitiated(address developerAddress, uint256 era, uint256 blockNumber)
```

_Emitted when a developer successfully initiates a withdrawal of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| developerAddress | address | The address of the developer initiating the withdrawal. |
| era | uint256 | The era for which the withdrawal was initiated. |
| blockNumber | uint256 | The block number at which the withdrawal was initiated. |

### DeveloperLevelIncreased

```solidity
event DeveloperLevelIncreased(address developerAddress, uint256 newLevel, uint256 blockNumber)
```

_Emitted when a developer's level is increased._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| developerAddress | address | The address of the developer whose level was increased. |
| newLevel | uint256 | The new total level of the developer. |
| blockNumber | uint256 | The block number at which the level increase occurred. |

