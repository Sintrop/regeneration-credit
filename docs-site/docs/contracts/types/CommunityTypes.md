# CommunityTypes

## CommunityTypes

### UserType

Summary of User Roles:

Regenerator: Core users providing terrestrial ecosystem regeneration services by
registering and managing a regeneration area.

Inspector: Responsible for decentralized data collection and verification of
Regenerators' activities, such as counting trees and assessing biodiversity.

Researcher: Responsible for environmental research, developing evaluation methodologies, and
creating impact calculator items.

Developer: Responsible for the technical development of the system, including
smart contracts, front-end interfaces, and related applications.

Activist: Empowered to invite new Regenerators and Inspectors into the system,
expanding the community's reach.

Contributor: A generic contribution user who can provide community support,
translations, design, and any other general functions that benefit the project.

Supporter: Any individual or organization, who can finance regeneration by
purchasing tokens from users and then burning them to receive an offset certificate.

_UserTypes of the system._

```solidity
enum UserType {
  UNDEFINED,
  REGENERATOR,
  INSPECTOR,
  RESEARCHER,
  DEVELOPER,
  CONTRIBUTOR,
  ACTIVIST,
  SUPPORTER
}
```

### Delation

_Struct representing a delation against a user or a resource.
These delations are intended to be filed due to unwanted behavior or non-compliance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Delation {
  uint64 id;
  address informer;
  address reported;
  string title;
  string testimony;
  uint256 createdAtBlock;
  uint256 thumbsUp;
  uint256 thumbsDown;
}
```

### Invitation

_Struct representing an invitation for a user to join the system as a specific `UserType`.
This data forms a chain connecting every invited user to their inviter._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Invitation {
  address invited;
  address inviter;
  enum CommunityTypes.UserType userType;
  uint256 createdAtBlock;
}
```

### UserTypeSetting

_Struct containing configuration settings and rules for each `UserType`.
These settings define behavior related to registration proportionality, invitation requirements, and voting status._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct UserTypeSetting {
  uint8 proportionalityOnRegister;
  bool directProportionalityRegistration;
  bool needInvitationOnRegister;
  uint32 invitationDelayBlocks;
  bool isVoter;
}
```

