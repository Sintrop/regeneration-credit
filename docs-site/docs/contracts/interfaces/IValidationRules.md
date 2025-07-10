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

### addContributionValidation

```solidity
function addContributionValidation(struct Contribution contribution, string justification, address validator) external
```

Adds a validation vote to a specific contribution.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contribution | struct Contribution | The full Contribution struct being validated. |
| justification | string | A string explaining the reason for the vote. |
| validator | address | The address of the user who is voting. |

### addReportValidation

```solidity
function addReportValidation(struct Report report, string justification, address validator) external
```

Adds a validation vote to a specific report.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| report | struct Report | The full Report struct being validated. |
| justification | string | A string explaining the reason for the vote. |
| validator | address | The address of the user who is voting. |

### addInspectionValidation

```solidity
function addInspectionValidation(struct Inspection inspection, string justification, address validator) external
```

Adds a validation vote to a specific inspection item.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| inspection | struct Inspection | The full Inspection struct being validated. |
| justification | string | A string explaining the reason for the vote. |
| validator | address | The address of the user who is voting. |

### addResearchValidation

```solidity
function addResearchValidation(struct Research research, string justification, address validator) external
```

Adds a validation vote to a specific research item.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| research | struct Research | The full Research struct being validated. |
| justification | string | A string explaining the reason for the vote. |
| validator | address | The address of the user who is voting. |

