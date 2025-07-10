# ISupporterRules

## ISupporterRules

Interface for the offseting-related query functionalities of the
SupporterRules contract.

### offset

```solidity
function offset(address supporterAddress, uint256 amount, uint64 calculatorItemId) external
```

### publish

```solidity
function publish(address supporterAddress, uint256 amount, string description, string content) external
```

### isSupporter

```solidity
function isSupporter(address addr) external returns (bool)
```

### calculateCommission

```solidity
function calculateCommission(address supporterAddress, uint256 amount) external returns (uint256 amountToBurn, uint256 commission, address inviter)
```

