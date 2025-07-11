# Invitable

## Invitable

Contract to determine if a user is eligible to send invitations based on their levels
relative to the average of his group.

_Contains a pure function to perform this check._

### INITIAL_USER_COUNT_THRESHOLD

```solidity
uint256 INITIAL_USER_COUNT_THRESHOLD
```

_The threshold of total users below (or equal to) which any user can invite.
This allows for easier invitations in the early stages of the system._

### canInvite

```solidity
function canInvite(uint256 totalLevels, uint256 totalUsers, uint256 userLevels) public pure returns (bool)
```

Checks if a user is eligible to send an invitation.

_Eligibility rules:
1. If the total number of users in the system is less than or equal to `INITIAL_USER_COUNT_THRESHOLD`,
any user can invite (returns true).
2. Otherwise, a user can invite if their `userLevels` are greater than or equal to the
average levels per user plus one (`avg = (totalLevels / totalUsers) + 1`)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalLevels | uint256 | The total levels accumulated by all users of a specific type in the system. |
| totalUsers | uint256 | The total number of users of a specific type registered in the system. |
| userLevels | uint256 | The total levels of the specific user wishing to invite. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the user can invite, false otherwise. |

