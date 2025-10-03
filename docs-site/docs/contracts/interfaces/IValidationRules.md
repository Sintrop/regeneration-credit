# IValidationRules

## IValidationRules

Interface for the ValidationRules contract, which manages the rules
for validating or invalidating user-submitted content.

### waitedTimeBetweenVotes

```solidity
function waitedTimeBetweenVotes(address account) external view returns (bool)
```

Checks if a user has waited the required time since their last vote.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the user (voter). |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the user is allowed to vote, false otherwise. |

### votesToInvalidate

```solidity
function votesToInvalidate() external view returns (uint256)
```

Returns the number of votes required to invalidate a user or resource.

_An explicit function that calculates and retrieves the invalidation threshold._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The required number of votes. |

### updateValidatorLastVoteBlock

```solidity
function updateValidatorLastVoteBlock(address validatorAddress) external
```

_Function to updade validator last vote block.number._

### addValidationPoint

```solidity
function addValidationPoint(address validatorAddress) external
```

_Function to updade voter validationPoints._

