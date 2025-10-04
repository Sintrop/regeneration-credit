# InspectorRules

## InspectorRules

This contract defines and manages the rules and data specific to "Inspector" users
within the system. Inspectors are primarily responsible for collecting data from regenerators.
and performing inspections, which may be subject to penalties for non-compliance.

_Inherits functionalities from `Callable` (for whitelisted function access) and `Ownable` (for contract deploy setup).
It interacts with `CommunityRules` for general user management and `InspectorPool` for reward distribution.
This contract handles inspector registration, inspection tracking, give-ups, and penalties._

### MINIMUM_INSPECTIONS_TO_POOL

```solidity
uint8 MINIMUM_INSPECTIONS_TO_POOL
```

The minimum number of completed inspections required for an inspector to be eligible for pool rewards.

### MAX_GIVEUPS

```solidity
uint8 MAX_GIVEUPS
```

The maximum allowed number of "give-ups" (accepted but unrealized inspections)
before an inspector's validity is affected (blocked from accepting new inspections).

### BLOCKS_TO_ACCEPT

```solidity
uint32 BLOCKS_TO_ACCEPT
```

The number of blocks an inspector must wait to accept a new inspection after realizing one.

### maxPenalties

```solidity
uint8 maxPenalties
```

The maximum number of penalties an inspector can accumulate before facing invalidation.

### penalties

```solidity
mapping(address => struct Penalty[]) penalties
```

A mapping from an inspector's wallet address to an array of `Penalty` structs they have received.

### inspectorsAddress

```solidity
mapping(uint256 => address) inspectorsAddress
```

A mapping from a unique inspector ID to their corresponding wallet address.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The address of the `CommunityRules` contract, used to interact with
community-wide rules and user types.

### inspectorPool

```solidity
contract IInspectorPool inspectorPool
```

The address of the `InspectorPool` contract, responsible for managing
and distributing token rewards to inspectors.

### inspectionRulesAddress

```solidity
address inspectionRulesAddress
```

The address of the `InspectionRules` contract.

### constructor

```solidity
constructor(address communityRulesAddress, address inspectorPoolAddress, uint8 maxPenalties_) public
```

_Initializes the InspectorRules contract with key parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | The address of the deployed `CommunityRules` contract. |
| inspectorPoolAddress | address | The address of the deployed `InspectorPool` contract. |
| maxPenalties_ | uint8 | The maximum allowed penalties for an inspector. |

### setContractCall

```solidity
function setContractCall(address _inspectionRulesAddress) public
```

_onlyOwner function to set contract call addresses.
This function must be called only once after the contract deploy and ownership must be renounced._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inspectionRulesAddress | address | Address of InspectionRules. |

### addInspector

```solidity
function addInspector(string name, string proofPhoto) external
```

Users must meet specific criteria (previous invitation, system vacancies)
to successfully register as an inspector.

Requirements:
- The caller (`msg.sender`) must not already be a registered user.
- The `name` string must not exceed `MAX_NAME_LENGTH` (50) characters in byte length.
- The `proofPhoto` string must not exceed `MAX_PROOF_PHOTO_LENGTH` (150) characters in byte length.
- Number of vacancies is proportional to the number of regenerators.
- The caller must have a previous valid invitation.

_Allows a user to attempt to register as an inspector.
Creates a new `Inspector` profile for the caller if all requirements are met._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The chosen name for the inspector. |
| proofPhoto | string | A hash or identifier (e.g., URL) for the inspector's identity verification photo. |

### withdraw

```solidity
function withdraw() external
```

Inspectors can claim tokens for their inspection service, provided they meet
the minimum inspection threshold and are eligible for the current era.

Requirements:
- The caller (`msg.sender`) must be a registered `INSPECTOR`.
- The inspector must have completed at least (3) inspections.
- The inspector must be eligible for withdrawal in their current era (checked via `inspectorPool.canWithdraw`).
- The inspector's current era (`inspector.pool.currentEra`) will be incremented upon successful withdrawal attempt.

_Allows an inspector to initiate a withdrawal of Regeneration Credits
based on their completed inspections and current era._

### afterAcceptInspection

```solidity
function afterAcceptInspection(address addr, uint64 lastInspectionId) external
```

This function is intended to be called by the InspectionRules contract.

_Processes actions after an inspection is accepted by an inspector.
This marks the time of acceptance and increments the inspector's "give-up" count._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. |
| lastInspectionId | uint64 | The ID of the inspection that was accepted. |

### afterRealizeInspection

```solidity
function afterRealizeInspection(address addr, uint32 score, uint64 inspectionId) external returns (uint256)
```

This function is called by the InspectionRules contract after an inspection is realized.

_MustBeAllowedCaller function to handle actions after an inspector successfully realizes (completes) an inspection.
This decrements give-ups and increments total inspections._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. |
| score | uint32 | The inspection regenerationScore. |
| inspectionId | uint64 | The inspection unique ID. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The updated total number of inspections completed by the inspector. |

### addPenalty

```solidity
function addPenalty(address addr, uint64 inspectionId) external returns (uint256)
```

This function can only be called by addresses whitelisted via the `Callable` contract's mechanisms.

_Allows an authorized caller (`ValidationRules` contract) to add a penalty to an inspector's record.
This function should be called when an inspector's performance is unsatisfactory, for example,
without justification or proofPhoto._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the inspector receiving the penalty. |
| inspectionId | uint64 | The ID of the inspection associated with this penalty. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total number of penalties the inspector has accumulated. |

### removePoolLevels

```solidity
function removePoolLevels(address addr, bool denied) external
```

Should only be called by the ValidatorRules address.

_Allows the validator rules to remove levels from an inspector's pool.
This function updates the inspector's local level and notifies the `InspectorPool` contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the inspector from whom levels are to be removed. |
| denied | bool | Remove level user status. If true, user is being denied. |

### decrementInspections

```solidity
function decrementInspections(address addr) external
```

Should only be called by the ValidatorRules address.

_Decrements an inspector's total completed inspections count.
This function is called when an inspection previously counted as valid is invalidated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. Requirements: - The inspector's `totalInspections` count must be greater than 0. |

### denyInspector

```solidity
function denyInspector(address userAddress) external
```

_Sets a user's to DENIED in CommunityRules and removes their levels from pools._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user to deny. |

### totalPenalties

```solidity
function totalPenalties(address addr) public view returns (uint256)
```

Provides the current penalty count for a specific inspector.

_Returns the total number of penalties an inspector address has accumulated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The total number of penalties for the given address. |

### getInspector

```solidity
function getInspector(address addr) public view returns (struct Inspector)
```

Provides the full profile of an inspector.

_Returns the detailed `Inspector` data for a given address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the inspector to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Inspector | Inspector The `Inspector` struct containing the user's data. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

This function provides the current era from the perspective of the reward pool.   * @return uint256 The current era of the `InspectorPool`.

_Returns the current era as determined by the `InspectorPool` contract._

### isInspectorValid

```solidity
function isInspectorValid(address addr) public view returns (bool)
```

_Checks if an inspector has less than `MAX_GIVEUPS` (maximum allowed give-ups).
Inspectors with `MAX_GIVEUPS` or more are considered invalid and blocked from core actions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the inspector is currently valid (has less than max give-ups), `false` otherwise. |

### canAcceptInspection

```solidity
function canAcceptInspection(address addr) public view returns (bool)
```

_Checks if an inspector is able to accept a new inspection, based on the time
elapsed since their last realized inspection._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The inspector's wallet address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the inspector can accept a new inspection, `false` otherwise. |

### InspectorRegistered

```solidity
event InspectorRegistered(uint256 id, address inspectorAddress, string name, uint256 blockNumber)
```

_Emitted when a new inspector successfully registers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the newly registered inspector. |
| inspectorAddress | address | The wallet address of the inspector. |
| name | string | The name provided by the inspector. |
| blockNumber | uint256 | The block number at which the registration occurred. |

### InspectorWithdrawalInitiated

```solidity
event InspectorWithdrawalInitiated(address inspectorAddress, uint256 era, uint256 blockNumber)
```

_Emitted when an inspector successfully initiates a withdrawal of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectorAddress | address | The address of the inspector initiating the withdrawal. |
| era | uint256 | The era for which the withdrawal was initiated. |
| blockNumber | uint256 | The block number at which the withdrawal was initiated. |

### InspectorLevelIncreased

```solidity
event InspectorLevelIncreased(address inspectorAddress, uint256 newLevel, uint256 blockNumber)
```

_Emitted when an inspector's level is increased._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectorAddress | address | The address of the inspector whose level was increased. |
| newLevel | uint256 | The new total level of the inspector. |
| blockNumber | uint256 | The block number at which the level increase occurred. |

