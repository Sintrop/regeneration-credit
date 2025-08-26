# SupporterRules

## SupporterRules

Manages the rules and data specific to Supporter users within the community.

_This contract handles supporter registration, profile updates, token burning
for environmental offsets and content publications, and management of reduction commitments._

### INVITER_PERCENTAGE

```solidity
uint8 INVITER_PERCENTAGE
```

Commission percentage paid to the inviter when an invited supporter burns tokens.

### supporters

```solidity
mapping(address => struct Supporter) supporters
```

The relationship between address and supporter data.

### calculatorItemCertificates

```solidity
mapping(address => mapping(uint64 => uint256)) calculatorItemCertificates
```

The relationship between address and burned tokens per calculator item.

### reductionCommitments

```solidity
mapping(address => uint64[]) reductionCommitments
```

The relationship between address and reduction commitment statements (stored as calculator item IDs).

### declaredReduction

```solidity
mapping(address => mapping(uint256 => bool)) declaredReduction
```

The

### supportersAddress

```solidity
mapping(uint256 => address) supportersAddress
```

The relationship between ID and supporter address.

### offsetsCount

```solidity
uint64 offsetsCount
```

Total number of offsets made across all supporters.

### publicationsCount

```solidity
uint64 publicationsCount
```

Total number of publications made across all supporters.

### publications

```solidity
mapping(uint64 => struct Publication) publications
```

The relationship between id and publication data.

### offsets

```solidity
mapping(uint64 => struct Offset) offsets
```

The relationship between offset id and its data.

### regenerationCredit

```solidity
contract IRegenerationCredit regenerationCredit
```

### constructor

```solidity
constructor(address communityRulesAddress, address researcherRulesAddress, address regenerationCreditAddress) public
```

_Initializes the SupporterRules contract with addresses of crucial external contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| communityRulesAddress | address | Address of the CommunityRules contract. |
| researcherRulesAddress | address | Address of the ResearcherRules contract, used for CalculatorItem data. |
| regenerationCreditAddress | address |  |

### addSupporter

```solidity
function addSupporter(string name, string description, string profilePhoto) external
```

Allows a new user to register as a Supporter.

_Registers the sender as a Supporter, assigning them a unique ID and updating CommunityRules.
Requires name and profile photo length to be within limits._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name of the supporter (max 100 characters). |
| description | string | Brief description of the the supporter (max 200 characters). |
| profilePhoto | string | The profile photo URL/hash of the supporter (max 150 characters). |

### updateProfilePhoto

```solidity
function updateProfilePhoto(string newPhoto) external
```

Allows a supporter to update their profile photo.

_Updates the 'profilePhoto' field for the calling supporter.
Only accessible by registered supporters, and enforces a max character limit._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPhoto | string | User's new profile photo URL/hash (max 150 characters). |

### offset

```solidity
function offset(uint256 amount, uint256 minAmountToBurn, uint64 calculatorItemId) external
```

Allows a supporter to burn tokens to compensate for a specific item's degradation.
Before calling this function, supporters must approve the SupporterRules contract to burn the tokens.

_This function calls the token transfer function to pay comissions and burnFrom to trade tokens
for the compensation certificate. If a valid calculatorItemId is provided,
records the burned amount as a certificate for that item._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Tokens to be burned (minimum 1 token in wei, i.e., 1e18). |
| minAmountToBurn | uint256 | Slippage protection: the minimum amount the user expects to burn after commission. |
| calculatorItemId | uint64 | The ID of the CalculatorItem, or 0 if not applicable. |

### publish

```solidity
function publish(uint256 amount, uint256 minAmountToBurn, string description, string content) external
```

_Called by the RC offset function to create a new publication record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Tokens to be burned (minimum 10 tokens in wei, i.e., 10e18). |
| minAmountToBurn | uint256 | Slippage protection: the minimum amount the user expects to burn after commission. |
| description | string | The description of the post. |
| content | string | The content of the post. |

### declareReductionCommitment

```solidity
function declareReductionCommitment(uint64 calculatorItemId) external
```

Allows a supporter to declare a reduction commitment for a specific calculator item.

_Records the calculator item ID as a commitment for the calling supporter.
Requires the calculator item to exist and the sender to be a registered supporter._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calculatorItemId | uint64 | The ID of the CalculatorItem for which the commitment is being declared. |

### calculateCommission

```solidity
function calculateCommission(address supporterAddress, uint256 amount) internal view returns (uint256 amountToBurn, uint256 commission, address inviter)
```

This functions calculates the comission to be sent to the supporter inviter.

_Public function to handle tokens to be burned and inviter commission.
It retrieves invitation data from CommunityRules to perform the burn._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporterAddress | address |  |
| amount | uint256 | The total amount of tokens to consider for burning (before commission). |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountToBurn | uint256 | The net amount of tokens burned by the supporter (after commission). |
| commission | uint256 | The commission for the invitation service provided. |
| inviter | address | The supporter inviter. |

### getReductionCommitments

```solidity
function getReductionCommitments(address addr) public view returns (uint64[])
```

Retrieves the list of reduction commitment item IDs for a specific address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the supporter. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64[] | uint256[] An array of calculator item IDs representing the commitments. |

### getSupporter

```solidity
function getSupporter(address addr) public view returns (struct Supporter)
```

Returns the detailed information of a supporter.

_Retrieves the full Supporter struct data for a specific address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | The address of the supporter. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Supporter | Supporter The `Supporter` struct containing their data. |

### SupporterRegistered

```solidity
event SupporterRegistered(address supporterAddress, uint256 supporterId, string name, string profilePhoto, uint256 createdAtBlock)
```

Emitted when a new supporter is registered.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporterAddress | address | The address of the newly registered supporter. |
| supporterId | uint256 | The unique ID assigned to the supporter. |
| name | string | The name of the supporter. |
| profilePhoto | string | The URL or hash of the supporter's profile photo. |
| createdAtBlock | uint256 | The block number at which the supporter was registered. |

### OffsetMade

```solidity
event OffsetMade(address supporterAddress, uint256 offsetId, uint256 amountBurned, uint256 calculatorItemId, uint256 blockNumber)
```

Emitted when a supporter burns tokens to offset degradation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporterAddress | address | The address of the supporter. |
| offsetId | uint256 | The unique ID of the offset record. |
| amountBurned | uint256 | The amount of tokens burned by the supporter for the offset. |
| calculatorItemId | uint256 | The ID of the calculator item, if associated. |
| blockNumber | uint256 | The block number at which the offset occurred. |

### PublicationPosted

```solidity
event PublicationPosted(address publisherAddress, uint256 publicationId, uint256 amountBurned, string description, uint256 blockNumber)
```

Emitted when a supporter burns tokens to publish content.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| publisherAddress | address | The address of the supporter. |
| publicationId | uint256 | The unique ID of the publication record. |
| amountBurned | uint256 | The amount of tokens burned by the supporter for the publication. |
| description | string | The description of the publication. |
| blockNumber | uint256 | The block number at which the publication occurred. |

### ReductionCommitmentDeclared

```solidity
event ReductionCommitmentDeclared(address supporterAddress, uint256 calculatorItemId, uint256 blockNumber)
```

Emitted when a supporter declares a reduction commitment.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporterAddress | address | The address of the supporter. |
| calculatorItemId | uint256 | The ID of the calculator item for the commitment. |
| blockNumber | uint256 | The block number at which the commitment was declared. |

