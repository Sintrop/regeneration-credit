# ActivistRules

## ActivistRules

This contract defines and manages the rules and data specific to "Activist" users
within the system. Activists are responsible for inviting new Regenerators
and Inspectors, and they earn rewards based on the approval of their invited users.

_Inherits functionalities from `Callable` (for whitelisted function access) and `Invitable`
(for managing invitation logic). It interacts with `CommunityRules` for general user management
and `ActivistPool` for reward distribution._

### MAX_USER_COUNT

```solidity
uint16 MAX_USER_COUNT
```

Maximum users count allowed for this UserType.

### MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS

```solidity
uint16 MINIMUM_INSPECTIONS_TO_WON_POOL_LEVELS
```

Minimum inspections an inviter must complete to add activist level.

### approvedInvites

```solidity
uint64 approvedInvites
```

The total count of all invitations that have been successfully approved across the entire system.

### totalActiveLevels

```solidity
uint256 totalActiveLevels
```

The sum of all active levels from non-denied activists. Used for governance calculations.

### activistsAddress

```solidity
mapping(uint256 => address) activistsAddress
```

A public mapping from a unique activist ID to their corresponding wallet address.
Facilitates lookup of an activist's address by their ID.

### communityRules

```solidity
contract ICommunityRules communityRules
```

The address of the `CommunityRules` contract, used to interact with
community-wide rules, user types, and invitation data.

### activistPool

```solidity
contract IActivistPool activistPool
```

The address of the `ActivistPool` contract, responsible for managing
and distributing token rewards to activists.

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
constructor(address communityRulesAddress, address activistPoolAddress) public
```

_Initializes the ActivistRules contract.
Sets the addresses for the `CommunityRules` and `ActivistPool` contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | The address of the deployed `CommunityRules` contract. |
| activistPoolAddress | address | The address of the deployed `ActivistPool` contract. |

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

### addActivist

```solidity
function addActivist(string name, string proofPhoto) external
```

Users must meet specific criteria (previously invitation, system proportionality)
to successfully register as an activist.

Requirements:
- The caller (`msg.sender`) must not already be a registered user.
- The `name` and `proofPhoto` strings must not exceed 100 characters in byte length.
- The total number of `ACTIVIST` users in the system must not exceed 16,000.

_Allows a user to attempt to register as an activist.
Creates a new `Activist` profile for the caller if all requirements are met._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The chosen name for the activist. |
| proofPhoto | string | A hash or identifier for the activist's identity verification photo. |

### withdraw

```solidity
function withdraw() external
```

Activists can claim tokens for the services provided. The distribution
is proportional to the amount of approved users in the current era.

Requirements:
- The caller (`msg.sender`) must be a registered `ACTIVIST`.
- The activist must have approvedUsers in their current era.
- The activist's current era (`activist.pool.currentEra`) will be incremented upon successful withdrawal attempt.

_Allows an activist to initiate a withdrawal of Regeneration Credits
based on their approved invited users and current era._

### addRegeneratorLevel

```solidity
function addRegeneratorLevel(address regeneratorAddress, uint256 regeneratorTotalInspections) external
```

This function should be called by the InspectionRules contract.
after a Regenerator completes their required inspections.

_External function for authorized callers to add a pool level to an activist
when an invited Regenerator reaches the minimum inspection threshold._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| regeneratorAddress | address | The wallet address of the invited Regenerator. |
| regeneratorTotalInspections | uint256 | The total number of inspections completed by the Regenerator. |

### addInspectorLevel

```solidity
function addInspectorLevel(address inspectorAddress, uint256 inspectorTotalInspections) external
```

This function should be called by the InspectionRules contract
after an Inspector completes their required inspections.

_External function for authorized callers to add a pool level to an activist
when an invited Inspector reaches the minimum inspection threshold._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspectorAddress | address | The wallet address of the invited Inspector. |
| inspectorTotalInspections | uint256 | The total number of inspections completed by the Inspector. |

### removePoolLevels

```solidity
function removePoolLevels(address addr) external
```

Can only be called by the ValidationRules contract.

_Allows an authorized caller to remove levels from an activist's pool.
This function updates the activist's local level if user is not being denied
 and notifies the `ActivistPool` contract to remove the pool level._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The wallet address of the activist from whom levels are to be removed. |

### canSendInvite

```solidity
function canSendInvite(address addr) public view returns (bool)
```

Returns `true` if the activist can send an invite, `false` otherwise.

_Checks if a specific activist address is eligible to send new invitations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the activist to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool `true` if the activist is eligible to send an invite, `false` otherwise. |

### getActivist

```solidity
function getActivist(address addr) public view returns (struct Activist)
```

Provides the full profile of an activist.

_Returns the detailed `Activist` data for a given address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the activist to retrieve. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Activist | Activist The `Activist` struct containing the user's data. |

### poolCurrentEra

```solidity
function poolCurrentEra() public view returns (uint256)
```

This function provides the current era from the perspective of the reward pool.

_Returns the current era as determined by the `ActivistPool` contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 The current era of the `ActivistPool`. |

### ActivistRegistered

```solidity
event ActivistRegistered(uint256 id, address activistAddress, string name, uint256 blockNumber)
```

_Emitted when a new activist successfully registers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | The unique ID of the newly registered activist. |
| activistAddress | address | The wallet address of the activist. |
| name | string | The name provided by the activist. |
| blockNumber | uint256 | The block number at which the registration occurred. |

### ActivistLevelIncreased

```solidity
event ActivistLevelIncreased(address activistAddress, uint256 newLevel, uint256 blockNumber)
```

_Emitted when an activist's level is increased._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activistAddress | address | The address of the activist whose level was increased. |
| newLevel | uint256 | The new total level of the activist. |
| blockNumber | uint256 | The block number at which the level increase occurred. |

### ActivistWithdrawalInitiated

```solidity
event ActivistWithdrawalInitiated(address activistAddress, uint256 era, uint256 blockNumber)
```

_Emitted when an activist successfully initiates a withdrawal of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activistAddress | address | The address of the activist initiating the withdrawal. |
| era | uint256 | The era for which the withdrawal was initiated. |
| blockNumber | uint256 | The block number at which the withdrawal was initiated. |

