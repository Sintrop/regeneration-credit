# ValidationRules

## ValidationRules

Responsible for reviewing and voting to invalidate users and resources.

_Manage validators rules and data. This contract is responsible for reviewing and voting to invalidate wrong or corrupted actions across different user types and resources._

### POINTS_PER_LEVEL

```solidity
uint256 POINTS_PER_LEVEL
```

Validation points required for one pool level.

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

### hunterVoter

```solidity
mapping(address => mapping(uint256 => address)) hunterVoter
```

Tracks the first user who voted to invalidate a specific user in a given era.

### hunterPools

```solidity
mapping(address => struct Pool) hunterPools
```

Mapping from a validators's address directly to their pool data.

### validationPoints

```solidity
mapping(address => uint256) validationPoints
```

Tracks the accumulated, unspent validation points for each voter.

### totalValidationLevels

```solidity
mapping(address => uint256) totalValidationLevels
```

Tracks the total number of validation levels a user has ever earned.

### communityRules

```solidity
contract ICommunityRules communityRules
```

CommunityRules contract interface.

### regeneratorRules

```solidity
contract IRegeneratorRules regeneratorRules
```

RegeneratorRules contract interface.

### inspectorRules

```solidity
contract IInspectorRules inspectorRules
```

InspectorRules contract interface.

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

### contributorRules

```solidity
contract IContributorRules contributorRules
```

ContributorRules contract interface.

### activistRules

```solidity
contract IActivistRules activistRules
```

ActivistRules contract interface.

### voteRules

```solidity
contract IVoteRules voteRules
```

VoteRules contract interface.

### validationPool

```solidity
contract IValidationPool validationPool
```

The interface of the `ValidationPool` contract, responsible for managing
and distributing token rewards to validators.

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

### addUserValidation

```solidity
function addUserValidation(address userAddress, string justification) external
```

Allows users to attempt to vote to invalidate an user.

_Votes to invalidate users with unwanted behavior.

Requirements:
- The caller must be a registered voter user (verified by VoteRules).
- Caller level must be above average (verified by VoteRules.canVote implicitly).
- Caller must have waited `timeBetweenVotes` since their last vote.
- Caller must vote only once per user per era.
- The target user must be registered and not already denied.
- If the target user is a Regenerator, they must have fewer than 4 completed inspections to be eligible for invalidation._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | Invalidation user address. |
| justification | string | Invalidation justification (Max characters). |

### exchangePointsForLevel

```solidity
function exchangePointsForLevel() external
```

Allows a voter to exchange their accumulated validation points for a single level.

_This function implements a fixed exchange rate where a voter can trade a specific
amount of points (POINTS_PER_LEVEL) for one level, which contributes to their
standing and potential rewards in the Validation Pool.

Requirements:
- The caller (`msg.sender`) must be a registered voter (e.g., Researcher, Developer, Contributor).
- The caller must have accumulated at least `POINTS_PER_LEVEL` points to be eligible for the exchange._

### withdraw

```solidity
function withdraw() external
```

Validators can claim tokens for their hunt and investigation service.

_Allows a validator to initiate a withdrawal of Regeneration Credits
for the malicious/fake users hunt service. Rewards will be based on their hunting level and current era._

### updateValidatorLastVoteBlock

```solidity
function updateValidatorLastVoteBlock(address validatorAddress) external
```

Called only by authorized callers.

_Update last validator vote block.number._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| validatorAddress | address | The validator wallet address. |

### addValidationPoint

```solidity
function addValidationPoint(address voter) external
```

Grants a single validation point to a voter for a voting action.

_This is a function intended to be called by the resources contract after a validation vote._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | The address of the voter who is earning the point. |

### getUserValidations

```solidity
function getUserValidations(address userAddress, uint256 currentEra) public view returns (uint256)
```

Get user validations count for a specific user in a given era.

_Retrieves the total number of validation votes received for a specified user and era._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user. |
| currentEra | uint256 | The era to check for validations. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The number of received invalidation votes. |

### votesToInvalidate

```solidity
function votesToInvalidate() public view returns (uint256)
```

Get how many validations is necessary to invalidate a user or resource.

_Calculates the required number of votes for invalidation based on the total number of registered voters in the system.
Calculation is based on the `votersCount` which includes researchers, developers, and contributors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count Number of votes required for invalidation. |

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
event UserValidation(address _validatorAddress, address _userAddress, string _justification, uint256 _currentEra)
```

Emitted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _validatorAddress | address | The address of the validator. |
| _userAddress | address | The wallet of the user receiving the vote. |
| _justification | string | The justification provided for the vote. |
| _currentEra | uint256 | User validation currentEra. |

