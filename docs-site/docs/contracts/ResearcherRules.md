# ResearcherRules

## ResearcherRules

This contract defines and manages the rules and data specific to "Researcher" users within the system.
Researchers are primarily responsible for the development of the project impact calculator, for the creation and improvement
of evaluation methods and through submitting researches, which are subject to validation and penalty mechanisms.

_Inherits functionalities from `Ownable` (for contract deploy setup), `Callable` (for whitelisted
function access), and `Invitable` (for managing invitation logic). It interacts with `CommunityRules`
for general user management, `ResearcherPool` for reward distribution, `VoteRules` for voting
eligibility, and `ValidationRules` for research validation processes._

### MAX_USER_COUNT

```solidity
uint16 MAX_USER_COUNT
```

Maximum users count allowed for this UserType.

### MIN_CARBON_IMPACT

```solidity
uint256 MIN_CARBON_IMPACT
```

Minimum 1g CO2e per unit

### MAX_CARBON_IMPACT

```solidity
uint256 MAX_CARBON_IMPACT
```

Maximum 1 ton CO2e per unit

### maxPenalties

```solidity
uint8 maxPenalties
```

The maximum number of penalties a researcher can accumulate before facing invalidation.

### timeBetweenWorks

```solidity
uint32 timeBetweenWorks
```

Waiting blocks to publish research.

### securityBlocksToValidation

```solidity
uint32 securityBlocksToValidation
```

The number of blocks before the end of an era during which no new researchs can be published.
This period allows validators sufficient time to analyze and vote on researchs before the era concludes.

### researchesCount

```solidity
uint64 researchesCount
```

The total count of researchs that are currently considered valid (not invalidated).

### researchesTotalCount

```solidity
uint64 researchesTotalCount
```

The grand total count of all researchs ever submitted, including invalidated ones.
This acts as a global unique ID counter for new researchs.

### totalActiveLevels

```solidity
uint256 totalActiveLevels
```

The sum of all active levels from valid researches by non-denied researchers.

### calculatorItemsCount

```solidity
uint64 calculatorItemsCount
```

Total calculatorItems count.

### evaluationMethodsCount

```solidity
uint64 evaluationMethodsCount
```

Total methods count.

### researches

```solidity
mapping(uint256 => struct Research) researches
```

A mapping from a unique research ID to its detailed `Research` data structure.
Stores all submitted researchs.

### researchesIds

```solidity
mapping(address => uint256[]) researchesIds
```

A mapping from a researcher's wallet address to an array of IDs of researchs they have submitted.

### calculatorItems

```solidity
mapping(uint64 => struct CalculatorItem) calculatorItems
```

The relationship between id and calculatorItem data.

### evaluationMethods

```solidity
mapping(uint256 => struct EvaluationMethod) evaluationMethods
```

The relationship between id and evaluationMethods data.

### penalties

```solidity
mapping(address => struct Penalty[]) penalties
```

A mapping from a researcher's wallet address to an array of `Penalty` structs they have received.

### researchPenalized

```solidity
mapping(uint64 => bool) researchPenalized
```

Tracks research IDs that have already been invalidated.

### researchersAddress

```solidity
mapping(uint256 => address) researchersAddress
```

A mapping from a unique reseracher ID to their corresponding wallet address.
Facilitates lookup of a reseracher's address by their ID.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The interface of the `CommunityRules` contract, used to interact with
community-wide rules, user types, and invitation data.

### researcherPool

```solidity
contract IResearcherPool researcherPool
```

The interface of the `ResearcherPool` contract, responsible for managing
and distributing token rewards to researchers.

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

### constructor

```solidity
constructor(uint32 timeBetweenWorks_, uint8 maxPenalties_, uint32 securityBlocksToValidation_) public
```

_Initializes the ResearcherRules contract with key immutable parameters.
These parameters define crucial operational behaviors that cannot be changed after deployment._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timeBetweenWorks_ | uint32 | Minimum number of blocks that must pass between a researcher's publications (research or calculator item). |
| maxPenalties_ | uint8 | The maximum number of penalties a researcher can accumulate before block. |
| securityBlocksToValidation_ | uint32 | The period in blocks before an era ends, during which new research cannot be added. This allows validators sufficient time for analysis before era finalization. |

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

### addResearcher

```solidity
function addResearcher(string name, string proofPhoto) external
```

Allows a user to register as a researcher.

_Requires the caller to have been previously invited (handled by `CommunityRules`)
and for researcher vacancies to be available._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The public name or alias of the researcher (max 50 characters). |
| proofPhoto | string | A hash or identifier for the researcher's identity photo/document (max 150 characters). |

### addResearch

```solidity
function addResearch(string title, string thesis, string file) external
```

Allows a registered researcher to publish a new 'research' report. A 'research' can be
a new calculator item, a new methodology or improvement of current ones or a generic regeneration research.

_Requires the caller to be a registered researcher, to be outside the security block window
(i.e., not too close to the end of an era), and to have waited the `timeBetweenWorks`
period since their last research publication._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| title | string | The title of the research paper (max 100 characters). |
| thesis | string | A short description or thesis statement (Max characters). |
| file | string | A hash or identifier for the research report file (max 150 characters). |

### addResearchValidation

```solidity
function addResearchValidation(uint64 id, string justification) external
```

Allows a voter to vote to invalidate a research.

_Requires the caller to be a registered voter, have sufficient level as defined by `VoteRules`,
and to have waited the `timeBetweenVotes` period (managed by `ValidationRules`).
If the validation count meets the threshold (`votesToInvalidate`), the research is marked as invalid._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The ID of the research to validate. |
| justification | string | A brief justification for invalidating the research (Max characters). |

### addCalculatorItem

```solidity
function addCalculatorItem(string item, string thesis, string unit, uint256 carbonImpact) external
```

Allows a researcher to publish a calculator item, used by users to calculate degradation.

_Requires the caller to be a registered researcher and to have waited the `timeBetweenWorks`
period since their last calculator item publication._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| item | string | The short name of the item (e.g., "Electricity", "Diesel") (max 35 characters). |
| thesis | string | The combined title and brief result justification for the item (max 350 characters). |
| unit | string | The unit of the item (e.g., "liters", "kWh", "kg") (max 20 characters). |
| carbonImpact | uint256 | The carbon impact in grams per unit (e.g., 200 for 200g CO2e/kWh). |

### addEvaluationMethod

```solidity
function addEvaluationMethod(string title, string research, string projectURL) external
```

Allows a researcher to publish an off-chain evaluation method or project.

_This function supports publishing a project or application that helps inspectors in analyzing regeneration areas, estimating the number of trees and biodiversity.
Each researcher is allowed to publish only one method._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| title | string | The title of the method (e.g., "Sattelite-driven Tree Counter") (max 100 characters). |
| research | string | The associated paper or research link (e.g., IPFS hash or URL) (max 100 characters). |
| projectURL | string | The URL of the project or code repository (max 100 characters). |

### withdraw

```solidity
function withdraw() external
```

Allows a researcher to attempt to withdraw regeneration credit from the researcher pool.

_Requires the caller to be a registered researcher and to be eligible to withdraw tokens
(eligibility determined by `ResearcherPool` and includes having published at least one research in the current era).
Increments the researcher's `pool.currentEra` upon successful withdrawal attempt._

### removePoolLevels

```solidity
function removePoolLevels(address addr) external
```

Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.

_Allows an authorized caller to remove levels from a researcher's pool.
This function updates the researcher's local score and notifies the `ResearcherPool` contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the researcher from whom levels are to be removed. |

### canSendInvite

```solidity
function canSendInvite(address addr) public view returns (bool)
```

Returns `true` if the researcher can send invites based on total researches, total researchers, and their pool level.

_Checks if a researcher is eligible to send invitations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the researcher. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the researcher can send an invite, `false` otherwise. |

### canPublishResearch

```solidity
function canPublishResearch(address addr) public view returns (bool)
```

_Checks if a researcher is eligible to publish a research._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the potential publisher. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the user can publish research, `false` otherwise. |

### canPublishCalculatorItem

```solidity
function canPublishCalculatorItem(address addr) public view returns (bool)
```

_Checks if a researcher is eligible to publish a calculator item._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the potential publisher. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the user can publish a calculator item, `false` otherwise. |

### getResearcher

```solidity
function getResearcher(address addr) public view returns (struct Researcher)
```

_Retrieves the detailed data of a specific researcher._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the researcher. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Researcher | The `Researcher` struct containing their data. |

### getResearch

```solidity
function getResearch(uint64 id) public view returns (struct Research)
```

_Retrieves the detailed data of a specific research._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The ID of the research. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Research | The `Research` struct containing its data. |

### totalPenalties

```solidity
function totalPenalties(address addr) public view returns (uint256)
```

Returns the total number of penalties received by a researcher.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The researcher's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total count of penalties. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

_Current researcherPool era._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Return the current contract pool era. |

### getCalculatorItem

```solidity
function getCalculatorItem(uint64 id) public view returns (struct CalculatorItem)
```

_Retrieves a specific calculator item by its ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The ID of the calculator item. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CalculatorItem | The `CalculatorItem` struct containing its data. |

### nextEraIn

```solidity
function nextEraIn() public view returns (uint256)
```

_Calculates the remaining blocks until the next era of the researcher pool.
Relies on the `ResearcherPool` contract to provide era progression logic._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of blocks remaining until the next era. |

### ResearcherRegistered

```solidity
event ResearcherRegistered(address researcherAddress, uint256 researcherId, string name)
```

_Emitted when a new researcher is successfully registered._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| researcherAddress | address | The address of the newly registered researcher. |
| researcherId | uint256 | The unique ID assigned to the researcher. |
| name | string | The public name of the researcher. |

### ResearchPublished

```solidity
event ResearchPublished(uint256 researchId, address researcher, uint256 publishedAt)
```

_Emitted when a new research report is published._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| researchId | uint256 | The unique ID of the published research. |
| researcher | address | The address of the researcher who published the research. |
| publishedAt | uint256 | The block number when the research was published. |

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

### ResearchInvalidated

```solidity
event ResearchInvalidated(uint256 researchId, address invalidatedBy, string justification)
```

_Emitted when a research is successfully invalidated by validators._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| researchId | uint256 | The ID of the research that was invalidated. |
| invalidatedBy | address | The address of the voter who performed the validation action (leading to invalidation). |
| justification | string | A brief justification for the invalidation. |

