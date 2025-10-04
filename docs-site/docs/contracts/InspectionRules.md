# InspectionRules

## InspectionRules

Manages the lifecycle of regeneration inspections, from request to realization and validation.

_This contract allows Regenerators to request inspections, and Inspectors to accept, perform, and submit them.
It integrates with various other rule contracts for user validation, level updates, and penalty management._

### MAX_REGENERATOR_INSPECTIONS

```solidity
uint8 MAX_REGENERATOR_INSPECTIONS
```

The maximum number of inspections a Regenerator can receive.

### MAX_BIODIVERSITY_RESULT

```solidity
uint32 MAX_BIODIVERSITY_RESULT
```

The maximum result value for the biodiversity score in an inspection.

### allowedInitialRequests

```solidity
uint8 allowedInitialRequests
```

Number of initial inspection requests a regenerator can make without `timeBetweenInspections` delay.

### timeBetweenInspections

```solidity
uint32 timeBetweenInspections
```

Time (in blocks) a regenerator must wait between inspection requests after exceeding initial allowed requests.

### blocksToExpireAcceptedInspection

```solidity
uint32 blocksToExpireAcceptedInspection
```

Amount of blocks an accepted inspection has before it expires if not realized.

### acceptInspectionDelayBlocks

```solidity
uint32 acceptInspectionDelayBlocks
```

Amount of blocks that inspectors must wait after a request is made before they can accept it.

### securityBlocksToValidation

```solidity
uint32 securityBlocksToValidation
```

Amount of blocks for validators to analyze inspections before an era ends.

### inspectionsCount

```solidity
uint64 inspectionsCount
```

Valid inspections count (inspections not invalidated).

### inspectionsTotalCount

```solidity
uint64 inspectionsTotalCount
```

Total inspections count, including open, accepted, realized, and invalidated ones.

### realizedInspectionsCount

```solidity
uint256 realizedInspectionsCount
```

Realized inspections count (inspections that have been completed and submitted).

### inspectionsTreesImpact

```solidity
uint256 inspectionsTreesImpact
```

Sum of all valid inspections' trees impact from all past settled eras.

### inspectionsBiodiversityImpact

```solidity
uint256 inspectionsBiodiversityImpact
```

Sum of all valid inspections' biodiversity impact from all past settled eras.

### totalImpactRegenerators

```solidity
uint256 totalImpactRegenerators
```

The total count of regenerators who are considered "impact regenerators",
have reached the minimum of one inspection validated.

### inspectionPenalized

```solidity
mapping(uint64 => bool) inspectionPenalized
```

Tracks inspection IDs that have already been invalidated.

### inspectorRules

```solidity
contract IInspectorRules inspectorRules
```

InspectorRules contract interface for interacting with inspector-specific logic.

### regeneratorRules

```solidity
contract IRegeneratorRules regeneratorRules
```

RegeneratorRules contract interface for interacting with regenerator-specific logic.

### communityRules

```solidity
contract ICommunityRules communityRules
```

CommunityRules contract interface for checking user types and other community-wide rules.

### validationRules

```solidity
contract IValidationRules validationRules
```

ValidationRules contract interface for handling inspection invalidations.

### activistRules

```solidity
contract IActivistRules activistRules
```

ActivistRules contract interface for updating activist levels based on inspection activities.

### voteRules

```solidity
contract IVoteRules voteRules
```

VoteRules contract interface for checking voter eligibility.

### regenerationIndexRules

```solidity
contract IRegenerationIndexRules regenerationIndexRules
```

RegenerationIndexRules contract interface for calculating regeneration scores.

### impactPerEra

```solidity
mapping(uint256 => struct EraImpact) impactPerEra
```

Tracks the impact generated within each specific era.

### lastSettledEra

```solidity
uint256 lastSettledEra
```

Tracks the number of the last era that impact has been set.

### constructor

```solidity
constructor(uint32 timeBetweenInspections_, uint32 blocksToExpireAcceptedInspection_, uint8 allowedInitialRequests_, uint32 acceptInspectionDelayBlocks_, uint32 securityBlocksToValidation_) public
```

Initializes the InspectionRules contract with key time and quantity parameters.

_Sets immutable values that govern inspection delays, expiration, and initial allowances._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timeBetweenInspections_ | uint32 | The number of blocks a regenerator must wait between requests. |
| blocksToExpireAcceptedInspection_ | uint32 | The number of blocks before an accepted inspection expires. |
| allowedInitialRequests_ | uint8 | The number of initial requests allowed without delay. |
| acceptInspectionDelayBlocks_ | uint32 | The number of blocks inspectors must wait before accept a new inspection. |
| securityBlocksToValidation_ | uint32 | The number of security blocks for validators before era end. |

### setContractInterfaces

```solidity
function setContractInterfaces(struct ContractsDependency contractDependency) external
```

Sets the addresses of all essential external contracts interfaces this contract depends on.

_This function can only be called once by the contract owner after deployment.
It initializes references to various *Rules contracts and the VoteRules contract.
Ownership should be renounced after this call._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractDependency | struct ContractsDependency | Struct containing addresses of necessary system contracts. |

### requestInspection

```solidity
function requestInspection() external
```

Regenerators agree to receive an inspector to assess their registered area.
They can make an `allowedInitialRequests` number of requests without delay.
After that, they must wait `timeBetweenInspections` blocks between requests.
A hard limit of 6 total inspections is enforced.

Requirements:
- The caller (`msg.sender`) must be a registered `REGENERATOR`.
- The regenerator must not have a `_pendingInspection` already open.
- The regenerator must adhere to the `timeBetweenInspections` delay if `allowedInitialRequests` are used up.
- The regenerator must have completed less than 6 total inspections.

_Allows a regenerator to request a new inspection for their registered area._

### acceptInspection

```solidity
function acceptInspection(uint64 inspectionId) external
```

Inspectors must only accept inspections they are capable of performing, being aware
of the safety risks and responsibilities. By accepting an inspection, inspectors agree that the they are responsible
for their own safety at the data collection. It is recommended to use long sleeves clothes, hats, boots that can prevent
bites from animals, gloves to protect from spines and any other useful safety equipment, such as machetes or pepper spray.
Accepting an inspection counts as a 'give-up' until realized.
Inspectors can only accept one open inspection at a time and cannot inspect the same regenerator twice.
They must also adhere to specific delays and security windows.

Requirements:
- The caller (`msg.sender`) must be a registered `INSPECTOR`.
- The inspector must have less than `MAX_GIVEUPS` (from InspectorRules).
- The `inspectionId` must correspond to an existing inspection.
- The inspector must not already have an inspection `ACCEPTED` that is not yet `INSPECTED` or `INVALIDATED` or `EXPIRED`.
- The inspector must not have previously inspected this specific regenerator.
- The inspection's status must be `OPEN` or `EXPIRED`.
- The `acceptInspectionDelayBlocks` must have passed since the inspection was created.
- The system must not be within the `securityBlocksToValidation` window before an era ends.
- The inspector must adhere to `inspectorRules.canAcceptInspection` (delay from last realized inspection).
- The `inspection.regenerator` must be a valid `REGENERATOR`.

_Allows an inspector to accept an open or expired inspection request._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint64 | The unique ID of the inspection the inspector wishes to accept. |

### realizeInspection

```solidity
function realizeInspection(uint64 inspectionId, string proofPhotos, string justificationReport, uint32 treesResult, uint32 biodiversityResult) external
```

Inspectors must evaluate the amount of trees and species of the regeneration area.
How many trees, palm trees and other plants over 1m high and 3cm in diameter there is in the regenerating area? Justify your answer in the report.
How many different species of those plants/trees were found? Each different species is equivalent to one unity and only trees and plants managed or planted by the regenerator should be counted. Justify your answer in the report.
Max result of 200.000 trees and 300 biodiversity.
Zero score means invalid inspection.
NOTE: If the inspector finds something suspicous about the inspected regenerator, such as invalid area, suspicious of fake account, or if the Regenerator is not
findable, inspectors are encourage to realize passing 0 as values with his justification at the report to avoid being penalized.

_Allow a inspector realize a inspection and mark as INSPECTED._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint64 | The id of the inspection to be realized. |
| proofPhotos | string | The string of a photo with the regenerator or the string of a document with the proofPhoto with the regenerator and other area photos. |
| justificationReport | string | The justification and report of the result found. |
| treesResult | uint32 | The number of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted. |
| biodiversityResult | uint32 | The number of different species of trees, palm trees and other plants over 1m high and 3cm in diameter found in the regeneration area. Only plants managed or planted by the regenerator must be counted. |

### addInspectionValidation

```solidity
function addInspectionValidation(uint64 id, string justification) external
```

Allows a voter to cast a vote to invalidate an inspection.
This function increments the validation count for the inspection and may trigger its invalidation.

Requirements:
- The `justification` string must not exceed `MAX_VALIDATION_JUSTIFICATION_LENGTH` (300) characters.
- The caller (`msg.sender`) must be a registered `voter` (`voteRules.canVote`).
- The caller must have waited the required `timeBetweenVotes` (from `validationRules.waitedTimeBetweenVotes`).
- The `inspectionId` must correspond to an existing and currently valid inspection.
- The inspection must have been realized (`INSPECTED` status).
- The current `poolCurrentEra() must be less than or equal to the `inspection's `inspectedAtEra` .

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The unique ID of the inspection to be validated/invalidated. |
| justification | string | A string explaining why the inspection is being invalidated. |

### getInspection

```solidity
function getInspection(uint64 id) public view returns (struct Inspection)
```

_Returns a inspection by id if that exists._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint64 | The id of the inspection to return. |

### getInspectionsHistory

```solidity
function getInspectionsHistory(address addr) public view returns (uint64[])
```

Get all regenerators inspections ID's list.

_Allows to get all regenerator inspections with status INSPECTED._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Regenerator address to check. |

### waitToRequest

```solidity
function waitToRequest(struct Regenerator regenerator) public view returns (bool)
```

Checks if regenerator waited timeBetweenInspections.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if can request. |

### calculateBlocksToExpire

```solidity
function calculateBlocksToExpire(uint64 inspectionId) public view returns (uint256)
```

Function to calculate amount of blocks to expire an inspection.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Return amount of blocks to expire an inspection. |

### alreadyHaveInspectionAccepted

```solidity
function alreadyHaveInspectionAccepted() public view returns (bool)
```

_Function that checks if an inspector already have an open inspection._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if can accept new inspection. False if has already an open inspection. |

### acceptInspectionDelayBlocksPassed

```solidity
function acceptInspectionDelayBlocksPassed(struct Inspection inspection) public view returns (bool)
```

_Function that checks if the inspection delay blocks has passed._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if can accept, false if not. |

### InspectionRequested

```solidity
event InspectionRequested(uint256 inspectionId, address regeneratorAddress, uint256 createdAt)
```

Emitted when a new inspection request is successfully created by a Regenerator.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint256 | The unique ID of the newly created inspection. |
| regeneratorAddress | address | The address of the Regenerator who requested the inspection. |
| createdAt | uint256 | The block number when the inspection was requested. |

### InspectionAccepted

```solidity
event InspectionAccepted(uint256 inspectionId, address inspectorAddress, uint256 acceptedAt)
```

Emitted when an Inspector successfully accepts an open inspection.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint256 | The ID of the inspection that was accepted. |
| inspectorAddress | address | The address of the Inspector who accepted the inspection. |
| acceptedAt | uint256 | The block number when the inspection was accepted. |

### InspectionRealized

```solidity
event InspectionRealized(uint256 inspectionId, address inspectorAddress, address regeneratorAddress, uint32 treesResult, uint32 biodiversityResult, uint32 regenerationScore, uint256 inspectedAt)
```

Emitted when an accepted inspection is successfully realized and submitted by an Inspector.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint256 | The ID of the inspection that was realized. |
| inspectorAddress | address | The address of the Inspector who realized the inspection. |
| regeneratorAddress | address | The address of the Regenerator whose area was inspected. |
| treesResult | uint32 | The reported number of trees. |
| biodiversityResult | uint32 | The reported number of species. |
| regenerationScore | uint32 | The calculated regeneration score. |
| inspectedAt | uint256 | The block number when the inspection was realized. |

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

### InspectionInvalidated

```solidity
event InspectionInvalidated(uint256 inspectionId, address inspectorAddress, address regeneratorAddress, uint256 invalidatedAt)
```

Emitted when an inspection is successfully invalidated due to validator votes.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectionId | uint256 | The ID of the inspection that was invalidated. |
| inspectorAddress | address | The address of the Inspector who performed the invalidated inspection. |
| regeneratorAddress | address | The address of the Regenerator whose inspection was invalidated. |
| invalidatedAt | uint256 | The block number when the inspection was invalidated. |

