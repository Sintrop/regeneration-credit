// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserType, Delation, Invitation, UserTypeSetting } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @author Sintrop
 * @title CommunityRules
 * @dev Users registration system
 * @notice Manage users types and data
 */
contract CommunityRules is Ownable, Callable {
  /// @notice The relationship between addresses and user type
  mapping(address => UserType) internal users;

  /// @notice The relationship between addresses and delations received
  mapping(address => Delation[]) private delations;

  /// @notice The relationship between addresses and invitation received
  mapping(address => Invitation) public invitations;

  /// @notice Active user count by userType
  mapping(UserType => uint256) public userTypesCount;

  /// @notice Active and invalid user count by userType
  mapping(UserType => uint256) public userTypesTotalCount;

  /// @notice Settings by userType
  mapping(UserType => UserTypeSetting) public userTypeSettings;

  /// @notice Total delations count received
  uint256 public delationsCount;

  /// @notice Total usersCount
  uint256 public usersCount;

  /// @notice Number of users allowed without proportion
  uint256 public constant MINIMUM_REGISTERED_USERS_QUANTITY = 5;

  constructor(
    uint256 inspectorProportionality,
    uint256 activistProportionality,
    uint256 researcherProportionality,
    uint256 developerProportionality,
    uint256 contributorProportionality
  ) {
    userTypeSettings[UserType.SUPPORTER] = UserTypeSetting(0, false, false, 150, false);
    userTypeSettings[UserType.REGENERATOR] = UserTypeSetting(0, false, true, 0, false);
    userTypeSettings[UserType.INSPECTOR] = UserTypeSetting(inspectorProportionality, true, true, 0, false);
    userTypeSettings[UserType.ACTIVIST] = UserTypeSetting(activistProportionality, false, true, 100000, true);
    userTypeSettings[UserType.RESEARCHER] = UserTypeSetting(researcherProportionality, false, true, 200000, true);
    userTypeSettings[UserType.DEVELOPER] = UserTypeSetting(developerProportionality, false, true, 200000, true);
    userTypeSettings[UserType.CONTRIBUTOR] = UserTypeSetting(contributorProportionality, false, true, 100000, true);
  }

  event AddUserEvent(address addr, UserType userType);
  event DeniedUserEvent(address addr);
  event AddDelelationEvent(address informer, address reported);
  event AddInvitationEvent(address inviter, address invited, UserType userTypeTo);

  /**
   * @dev Add new user in the system
   * @param addr The address of the user
   * @param userType The type of the user - enum UserType
   */
  function addUser(address addr, UserType userType) public mustBeAllowedCaller {
    // Only one registration per address
    require(users[addr] == UserType.UNDEFINED, "User already exists");
    // Must selected the appropriate userType
    require(userType != UserType.UNDEFINED, "Invalid user type");
    // Vacancies according to the number of regenerators
    require(registrationProportionalityAllowed(userType), "Proportionality invalid");
    // Only with valid invitation
    require(invitedTypeOnRegister(addr, userType), "Invalid invitation");

    users[addr] = userType;
    usersCount++;
    userTypesCount[userType]++;
    userTypesTotalCount[userType]++;

    emit AddUserEvent(addr, userType);
  }

  /**
   * @dev Checks if a user can invite a userType
   * @param addr The address of the user
   * @param userType The type of the user - enum UserType
   */
  function invitedTypeOnRegister(address addr, UserType userType) internal view returns (bool) {
    if (!userTypeSettings[userType].needInvitationOnRegister) return true;

    Invitation memory invitation = invitations[addr];

    return invitation.createdAtBlock > 0 && invitation.userType == userType;
  }

  /**
   * @dev Check if proportionality is allowed
   * @param userType The type of the user - enum UserType
   */
  function registrationProportionalityAllowed(UserType userType) internal view returns (bool) {
    uint256 regeneratorsCount = userTypesCount[UserType.REGENERATOR];
    uint256 registeredUserTypeCount = userTypesCount[userType];
    UserTypeSetting memory setting = userTypeSettings[userType];
    uint256 proportionality = setting.proportionalityOnRegister;

    if (proportionality == 0) return true;
    if (registeredUserTypeCount < MINIMUM_REGISTERED_USERS_QUANTITY) return true;

    if (setting.directProportionalityRegistration) return registeredUserTypeCount < regeneratorsCount * proportionality;
    return registeredUserTypeCount <= regeneratorsCount / proportionality;
  }

  /**
   * @notice Get the total of voters
   */
  function votersCount() public view returns (uint256) {
    return
      userTypesCount[UserType.ACTIVIST] +
      userTypesCount[UserType.CONTRIBUTOR] +
      userTypesCount[UserType.DEVELOPER] +
      userTypesCount[UserType.RESEARCHER];
  }

  /**
   * @notice Checks if the user is a voter
   * @param addr The user address
   */
  function isVoter(address addr) public view returns (bool) {
    return getUserTypeSettings(users[addr]).isVoter;
  }

  /**
   * @notice Get the type of a user
   * @param addr Checked address
   */
  function getUser(address addr) public view returns (UserType) {
    return users[addr];
  }

  /**
   * @notice Get the userType settings of a userType
   * @param userType Checked userType
   */
  function getUserTypeSettings(UserType userType) public view returns (UserTypeSetting memory) {
    return userTypeSettings[userType];
  }

  /**
   * @dev Add new delation in the system
   * @notice Users should add delations to report users or resources that should be invalidated
   *
   * Examples of unwanted behavior:
   *
   * - A user voting to invalidate a valid resource
   * - User without valid proofPhoto
   * - Inspections without valid proofPhoto
   * - Inspections without valid justification report
   * - Resources without valid justifications report
   * - Inactive users
   *
   * @param addr The address of the user
   * @param title Title the delation
   * @param testimony Delation justification
   */
  function addDelation(address addr, string memory title, string memory testimony) public {
    require(bytes(title).length <= 100 && bytes(testimony).length <= 300, "Max characters reached");
    require(users[msg.sender] != UserType.UNDEFINED, "Caller must be registered");
    require(users[msg.sender] != UserType.SUPPORTER, "Not allowed to supporters");
    require(users[addr] != UserType.UNDEFINED, "User must be registered");

    delations[addr].push(Delation(delationsCount + 1, msg.sender, addr, title, testimony));
    delationsCount++;

    emit AddDelelationEvent(msg.sender, addr);
  }

  /**
   * @dev Attemp to add an invitation, called by invitation contract
   * @param inviter Inviter address
   * @param invited Invited address
   * @param userType Checked userType
   */
  function addInvitation(address inviter, address invited, UserType userType) public mustBeAllowedCaller {
    require(invitations[invited].invited == address(0), "Already invited");
    require(users[invited] == UserType.UNDEFINED, "Already registered");

    invitations[invited] = Invitation(invited, inviter, userType, block.number);

    emit AddInvitationEvent(inviter, invited, userType);
  }

  /**
   * @dev Called by validationRules
   * @notice Function to set an user to denied
   * @param userAddress Denied user address
   */
  function setDeniedType(address userAddress) public mustBeAllowedCaller {
    if (users[userAddress] == UserType.DENIED) return;

    userTypesCount[users[userAddress]]--;

    users[userAddress] = UserType.DENIED;

    emit DeniedUserEvent(userAddress);
  }

  /**
   * @dev True if userAddress is equal userType
   * @notice Function to check if an userAddress type is equal passed userType
   * @param userAddress Denied user address
   */
  function userTypeIs(UserType userType, address userAddress) public view returns (bool) {
    return users[userAddress] == userType;
  }

  /**
   * @dev Returns the user address delated
   */
  function getUserDelations(address addr) public view returns (Delation[] memory) {
    return delations[addr];
  }

  /**
   * @dev Returns the invitation
   * @notice Get the invitation of an user
   * @param addr User address
   */
  function getInvitation(address addr) public view returns (Invitation memory) {
    return invitations[addr];
  }
}
