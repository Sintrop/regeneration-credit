# IVoteRules

## IVoteRules

Interface for the VoteRules contract, which manages voting eligibility.

### canVote

```solidity
function canVote(address account) external view returns (bool)
```

Checks if a given account is eligible to vote.

_This is the single public entry point for checking voting rights._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the account can vote, false otherwise. |

