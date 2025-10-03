# RegeneratorRules

## RegeneratorRules

This contract defines and manages the rules and data specific to "Regenerator" users
within the system. Regenerators are individuals, families, or groups providing ecosystem
regeneration services to an area.

_Inherits functionalities from `Ownable` (for contract deploy setup) and `Callable` (for whitelisted
function access). It interacts with `CommunityRules` for general user management and `RegeneratorPool`
for reward distribution. This contract handles regenerator registration, area management (coordinates,
total area), regeneration score tracking, inspection processes, and penalty management._

### MINIMUM_INSPECTIONS_TO_POOL

```solidity
uint8 MINIMUM_INSPECTIONS_TO_POOL
```

The minimum number of successful inspections a regenerator must have
to be eligible for rewards from the Regenerator Pool.

### MAXIMUM_INSPECTIONS

```solidity
uint8 MAXIMUM_INSPECTIONS
```

The maximum number of successful inspections a regenerator must have
to conclude the inspection life cycle.

### MIN_REGENERATION_AREA

```solidity
uint32 MIN_REGENERATION_AREA
```

Minimum total area in square meters (m²) for a regeneration project.

### MAX_REGENERATION_AREA

```solidity
uint32 MAX_REGENERATION_AREA
```

Maximum total area in square meters (m²) for a regeneration project.

### MAX_ACTIVE_REGENERATORS

```solidity
uint256 MAX_ACTIVE_REGENERATORS
```

The maximum number of active 'Regenerator' type users permitted in the system.

### regeneratorsAddress

```solidity
mapping(uint256 => address) regeneratorsAddress
```

A mapping from a unique regenerator ID to their corresponding wallet address.
Facilitates lookup of a regenerator's address by their ID.

### coordinates

```solidity
mapping(address => struct Coordinates[]) coordinates
```

A mapping from a regenerator's wallet address to an array of coordinate points
defining the boundaries of their regeneration area.

### projectDescriptions

```solidity
mapping(address => string) projectDescriptions
```

A mapping from a regenerator's wallet address to their project description.

### impactRegenerators

```solidity
mapping(address => bool) impactRegenerators
```

A mapping to track if a regenerator is an "impact regenerator" (has successfully
completed at least one inspections).

### certifiedRegenerators

```solidity
mapping(address => bool) certifiedRegenerators
```

A mapping to track if a regenerator is a "certified regenerator", a user that has successfully
completed the maximum inspections number, concluding system participation.

### areaPhoto

```solidity
mapping(address => string) areaPhoto
```

A mapping from a regenerator's wallet address to a hash or identifier of their area photo.

### newCertificationRegenerators

```solidity
mapping(uint256 => uint256) newCertificationRegenerators
```

The number of regenerators that have started the certification process on each era,
and have reached the minimum of one inspection.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The address of the `CommunityRules` contract, used to interact with
community-wide rules and user types.

### regeneratorPool

```solidity
contract IRegeneratorPool regeneratorPool
```

The address of the `RegeneratorPool` contract, responsible for managing
and distributing token rewards to regenerators.

### totalCertifiedRegenerators

```solidity
uint256 totalCertifiedRegenerators
```

The total count of regenerators who have completed the certification process.

### regenerationArea

```solidity
uint256 regenerationArea
```

The grand total sum of all regeneration area (in square meters [m²])
managed by all registered regenerators in the system.

### inspectionRulesAddress

```solidity
address inspectionRulesAddress
```

The address of the `InspectionRules` contract.

### validationRulesAddress

```solidity
address validationRulesAddress
```

The address of the `InspectionRules` contract.

### constructor

```solidity
constructor(address communityRulesAddress, address regeneratorPoolAddress) public
```

_Initializes the ContributorRules contract with key parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | The address of the deployed `CommunityRules` contract. |
| regeneratorPoolAddress | address | The address of the deployed `RegeneratorPool` contract. |

### setContractCall

```solidity
function setContractCall(address _inspectionRulesAddress, address _validationRulesAddress) external
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inspectionRulesAddress | address | Address of InspectionRules. |
| _validationRulesAddress | address | Address of ValidationRules. |

### addRegenerator

```solidity
function addRegenerator(uint32 totalArea, string name, string proofPhoto, string projectDescription, struct Coordinates[] _coordinates) external
```

Registers a new regenerator and their area of regeneration within the system.
This area can be subject to inspections and potential rewards.

Requirements:
- The caller (`msg.sender`) must not already be a registered regenerator.
- The `name` string must not exceed `MAX_NAME_LENGTH` (50) characters in byte length.
- The `proofPhoto` string must not exceed `MAX_HASH_LENGTH` (150) characters in byte length.
- The `projectDescription` string must not exceed `MAX_PROJECT_DESCRIPTION_LENGTH` (200) characters in byte length.
- The `_coordinates` array must contain between (3) and (10) points.
- The `totalArea` must be between (2500) and (1,000,000) square meters [m²].

_Allows a user to attempt to register as a regenerator.
Creates a new `Regenerator` profile for the caller if all requirements are met._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalArea | uint32 | The total area (in square meters [m²]) to be registered. |
| name | string | The chosen name for the regenerator. |
| proofPhoto | string | A hash or identifier for the regenerator's identity verification photo. |
| projectDescription | string | A brief description of the regeneration project. |
| _coordinates | struct Coordinates[] | An array of coordinate points defining the boundaries of the regeneration area. |

### withdraw

```solidity
function withdraw() external
```

Regenerators can claim tokens for their regeneration service, provided they meet
the minimum inspection threshold and are eligible for the current era.
To win more tokens, regenerators must plant more trees from different species.

Requirements:
- The caller (`msg.sender`) must be a registered `REGENERATOR`.
- The regenerator must have completed at least (3) inspections.
- The regenerator must have a positive regeneration score.
- The regenerator's current era (`regenerator.pool.currentEra`) will be incremented upon successful withdrawal attempt.

_Allows a regenerator to initiate a withdrawal of Regeneration Credits
based on their completed inspections and current era._

### updateAreaPhoto

```solidity
function updateAreaPhoto(string newPhoto) external
```

Allows a regenerator to update their area photo for their regeneration area.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPhoto | string | The new hash or identifier of the area photo. Requirements: - The `newPhoto` string must not exceed 150 characters in byte length. - The caller (`msg.sender`) must be a registered `REGENERATOR`. |

### removePoolLevels

```solidity
function removePoolLevels(address addr) external
```

Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.

_Allows an authorized caller to remove levels from a regenerator's pool.
This function updates the regenerator's local regeneration score and notifies the `RegeneratorPool` contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the regenerator from whom levels are to be removed. |

### removeInspectionLevels

```solidity
function removeInspectionLevels(address addr, uint256 amountToRemove) external
```

Can only be called by the ValidationRules address. If `levelsToRemove` is 0,
this implies a full invalidation or blocking, resetting the score to 0 and decrementing the total area.

_Allows an authorized caller to remove levels from a regenerator's pool.
This function updates the regenerator's local regeneration score and notifies the `RegeneratorPool` contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the regenerator from whom levels are to be removed. |
| amountToRemove | uint256 | The number of levels/score points to decrease. |

### decrementInspections

```solidity
function decrementInspections(address addr) external
```

Can only be called by the ValidationRules address.

Requirements:
- The regenerator's `totalInspections` count must be greater than 0.
- If `totalInspections` becomes 0 after decrement, the regenerator is removed from `impactRegenerators`.

_Allows an authorized caller to decrement a regenerator's total completed inspections count.
This function is called when an inspection previously counted as valid is invalidated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The regenerator's wallet address. |

### afterRequestInspection

```solidity
function afterRequestInspection(address addr) external
```

This function is intended to be called by a whitelisted contract, the InspectionRules.

_Processes actions after a regenerator requests an inspection for their area.
Sets the `_pendingInspection` status to `true` and records the `_lastRequestAt` timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The regenerator's wallet address. |

### afterAcceptInspection

```solidity
function afterAcceptInspection(address addr) external
```

Processes actions after an inspector accepts an inspection request from a regenerator.
Sets the regenerator's `_pendingInspection` status to `false`.

_This function is intended to be called by a whitelisted external contract, the InspectorRules._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The regenerator's wallet address. |

### afterRealizeInspection

```solidity
function afterRealizeInspection(address addr, uint32 score, uint64 inspectionId) external returns (uint256)
```

Processes actions after an inspection is successfully realized for a regenerator's area.
Increments the regenerator's total inspections and updates their regeneration score.

_This function is intended to be called by a whitelisted external contract, the InspectionRules
after an inspection is completed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The regenerator's wallet address. |
| score | uint32 | The score obtained from the realized inspection, to be added to the regenerator's total score. |
| inspectionId | uint64 | The id of the realized inspection. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The updated total number of inspections for the regenerator. |

### getRegenerator

```solidity
function getRegenerator(address addr) public view returns (struct Regenerator regenerator)
```

Provides the full profile of a regenerator.

_Returns the detailed `Regenerator` data for a given address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the regenerator to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| regenerator | struct Regenerator | The `Regenerator` struct containing the user's data. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

This function provides the current era from the perspective of the reward pool,
which is essential for era-based eligibility and reward calculations for regenerators.

_Returns the current era as determined by the `RegeneratorPool` contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current era of the `RegeneratorPool`. |

### nextEraIn

```solidity
function nextEraIn() public view returns (uint256)
```

Provides a countdown to the next era for regenerator planning.

_Calculates the number of blocks remaining until the start of the next era,
according to the `RegeneratorPool` contract's era definition._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The amount of blocks remaining until the next era begins. |

### regenerationTotalArea

```solidity
function regenerationTotalArea() public view returns (uint256)
```

_Returns the grand total sum of all regeneration area (in square meters [m²])
managed by all registered regenerators in the system._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total regeneration area in square meters [m²]. |

### getCoordinates

```solidity
function getCoordinates(address addr) public view returns (struct Coordinates[])
```

_Returns all coordinate points defining a regenerator's area._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The regenerator's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Coordinates[] | Coordinates[] An array of `Coordinates` structs representing the regenerator's area. |

### isRegistrationAllowed

```solidity
function isRegistrationAllowed() public view returns (bool)
```

Checks if new Regenerator registrations are allowed based on the dynamic count of active users.

_The number of active users is calculated as the total number of valid Regenerators
minus the number of those who have completed their lifecycle._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if registration is allowed, false otherwise. |

### RegeneratorRegistered

```solidity
event RegeneratorRegistered(uint256 id, address regeneratorAddress, string name, uint32 totalArea, uint256 blockNumber)
```

_Emitted when a new regenerator successfully registers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the newly registered regenerator. |
| regeneratorAddress | address | The wallet address of the regenerator. |
| name | string | The name provided by the regenerator. |
| totalArea | uint32 | The total area (in square meters) managed by the regenerator. |
| blockNumber | uint256 | The block number at which the registration occurred. |

### RegeneratorWithdrawalInitiated

```solidity
event RegeneratorWithdrawalInitiated(address regeneratorAddress, uint256 era, uint256 blockNumber)
```

_Emitted when a regenerator successfully initiates a withdrawal of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regeneratorAddress | address | The address of the regenerator initiating the withdrawal. |
| era | uint256 | The era for which the withdrawal was initiated. |
| blockNumber | uint256 | The block number at which the withdrawal was initiated. |

### RegeneratorEnteredPool

```solidity
event RegeneratorEnteredPool(address regeneratorAddress, uint256 blockNumber)
```

_Emitted when a regenerator initially enters the contract's reward pool
by meeting the minimum inspection criteria and `onContractPool` is set to true._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regeneratorAddress | address | The address of the regenerator entering the pool. |
| blockNumber | uint256 | The block number at which the regenerator entered the pool. |

### RegeneratorCertified

```solidity
event RegeneratorCertified(address regeneratorAddress)
```

_Emitted when a regenerator completes the inspection process._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regeneratorAddress | address | The address of the regenerator entering the pool. |

