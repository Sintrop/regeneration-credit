// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserType, Delation, Invitation, UserTypeSetting } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @author Sintrop
 * @title CommunityRules
 * @notice Manages user types, registration, invitations, and a delation system within the community.
 * @dev This contract acts as a central registry for user data, defining rules for user types, proportionality in registration, and handling reports of unwanted behavior.
 */
contract CommunityRules is Ownable, Callable {
  // --- State Variables ---

  /// @notice The relationship between addresses and user type
  mapping(address => UserType) internal users;

  /// @notice The relationship between addresses and delations received
  mapping(address => Delation[]) private delations;

  /// @notice The relationship between addresses and invitation received
  mapping(address => Invitation) public invitations;

  /// @notice Active user count by userType
  mapping(UserType => uint256) public userTypesCount;

  /// @notice Active and invalid user count by userType (total registered including denied).
  mapping(UserType => uint256) public userTypesTotalCount;

  /// @notice Settings by userType, including proportionality, invitation requirements, and voter status.
  mapping(UserType => UserTypeSetting) public userTypeSettings;

  /// @notice Total count of delations received across all users.
  uint256 public delationsCount;

  /// @notice Total active users count in the system.
  uint256 public usersCount;

  /// @notice Minimum number of users allowed for a specific type before proportionality rules apply.
  uint256 public constant MINIMUM_REGISTERED_USERS_QUANTITY = 5;

  // --- Constructor ---

  /**
   * @notice Initializes the CommunityRules contract by setting up initial proportionality and invitation rules for various user types.
   * @dev Sets predefined `UserTypeSetting` for Regenerators, Inspectors, Activists, Researchers, Developers, and Contributors.
   * @param inspectorProportionality Defines the proportionality ratio for Inspector registration.
   * @param activistProportionality Defines the proportionality ratio for Activist registration.
   * @param researcherProportionality Defines the proportionality ratio for Researcher registration.
   * @param developerProportionality Defines the proportionality ratio for Developer registration.
   * @param contributorProportionality Defines the proportionality ratio for Contributor registration.
   */

  constructor(
    uint256 inspectorProportionality,
    uint256 activistProportionality,
    uint256 researcherProportionality,
    uint256 developerProportionality,
    uint256 contributorProportionality
  ) {
    // Initialize settings for all relevant UserTypes
    userTypeSettings[UserType.SUPPORTER] = UserTypeSetting(0, false, false, 150, false);
    userTypeSettings[UserType.REGENERATOR] = UserTypeSetting(0, false, true, 0, false);
    userTypeSettings[UserType.INSPECTOR] = UserTypeSetting(inspectorProportionality, true, true, 0, false);
    userTypeSettings[UserType.ACTIVIST] = UserTypeSetting(activistProportionality, false, true, 100000, true);
    userTypeSettings[UserType.RESEARCHER] = UserTypeSetting(researcherProportionality, false, true, 100000, true);
    userTypeSettings[UserType.DEVELOPER] = UserTypeSetting(developerProportionality, false, true, 100000, true);
    userTypeSettings[UserType.CONTRIBUTOR] = UserTypeSetting(contributorProportionality, false, true, 100000, true);
  }

  // --- Events ---

  /**
   * @notice Emitted when a new user is successfully added to the system.
   * @param addr The address of the newly registered user.
   * @param userType The `UserType` assigned to the new user.
   */
  event AddUserEvent(address indexed addr, UserType userType);

  /**
   * @notice Emitted when a user's type is changed to `DENIED`.
   * @param addr The address of the user who has been denied.
   */
  event DeniedUserEvent(address indexed addr);

  /**
   * @notice Emitted when a delation is successfully added.
   * @param informer The address of the user who submitted the delation.
   * @param reported The address of the user being reported.
   */
  event AddDelelationEvent(address indexed informer, address indexed reported);

  /**
   * @notice Emitted when an invitation is successfully added to the system.
   * @param inviter The address of the user who issued the invitation.
   * @param invited The address of the user who received the invitation.
   * @param userTypeTo The `UserType` the invited user is intended to register as.
   */
  event AddInvitationEvent(address indexed inviter, address indexed invited, UserType userTypeTo);

  // --- External Functions (State Modifying) ---

  /**
   * @notice Adds a new user to the system with a specified user type.
   * @dev This function can only be called by an allowed caller (e.g., specific *Rules contracts for each user type).
   * It enforces rules for single registration per address, valid user types, proportionality limits, and valid invitations if required.
   * @param addr The address of the user to be registered.
   * @param userType The desired `UserType` for the user.
   */
  function addUser(address addr, UserType userType) public mustBeAllowedCaller {
    require(addr != address(0), "User address cannot be zero");
    require(users[addr] == UserType.UNDEFINED, "User already exists"); // Only one registration per address
    require(userType != UserType.UNDEFINED && userType != UserType.DENIED, "Invalid user type"); // Must selected the appropriate userType
    require(registrationProportionalityAllowed(userType), "Proportionality invalid"); // Vacancies according to the number of regenerators
    require(invitedTypeOnRegister(addr, userType), "Invalid invitation"); // Only with valid invitation

    users[addr] = userType;
    usersCount++;
    userTypesCount[userType]++;
    userTypesTotalCount[userType]++;

    emit AddUserEvent(addr, userType);
  }

  /**
   * @dev Adds a new delation to the system. Enforces character limits for title and testimony, and requires both reporter and reported user to be registered.
   * @notice Allows registered users (excluding Supporters) to report other users or resources that may require invalidation.
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
   * @param addr The address of the user being reported.
   * @param title Title of the delation (max 100 characters).
   * @param testimony Justification/details of the delation (max 300 characters).
   */
  function addDelation(address addr, string memory title, string memory testimony) public {
    require(bytes(title).length <= 100 && bytes(testimony).length <= 300, "Max characters reached");
    require(users[msg.sender] != UserType.UNDEFINED, "Caller must be registered");
    require(users[msg.sender] != UserType.SUPPORTER, "Not allowed to supporters");
    require(users[addr] != UserType.UNDEFINED, "User must be registered");
    require(addr != address(0), "Cannot delate zero address");

    delations[addr].push(Delation(delationsCount + 1, msg.sender, addr, title, testimony));
    delationsCount++;

    emit AddDelelationEvent(msg.sender, addr);
  }

  /**
   * @notice Attempts to add an invitation for a user.
   * @dev This function is intended to be called by an allowed caller (e.g., an Invitation Rules).
   * It records an invitation for a specific user to register as a certain user type.
   * Prevents re-inviting an already invited or registered address.
   * @param inviter The address of the user who issued the invitation.
   * @param invited The address of the user who received the invitation.
   * @param userType The `UserType` the `invited` user is intended to register as.
   */
  function addInvitation(address inviter, address invited, UserType userType) public mustBeAllowedCaller {
    require(invited != address(0), "Invited address cannot be zero");
    require(invitations[invited].invited == address(0), "Already invited");
    require(users[invited] == UserType.UNDEFINED, "Already registered");

    invitations[invited] = Invitation(invited, inviter, userType, block.number);

    emit AddInvitationEvent(inviter, invited, userType);
  }

  /**
   * @notice Sets a user's type to `DENIED`.
   * @dev This function is intended to be called by an allowed caller (e.g., `ValidationRules`).
   * It decrements the count of the user's previous type and sets their `UserType` to `DENIED`.
   * Prevents re-denying an already denied user.
   * @param userAddress The address of the user to be denied.
   */
  function setDeniedType(address userAddress) public mustBeAllowedCaller {
    if (users[userAddress] == UserType.DENIED) return;

    userTypesCount[users[userAddress]]--; // Decrement count of the old user type

    users[userAddress] = UserType.DENIED;

    emit DeniedUserEvent(userAddress);
  }

  // --- Internal Functions ---

  /**
   * @dev Checks if a user can register with a specific user type based on invitation requirements.
   * @param addr The address of the user attempting to register.
   * @param userType The `UserType` the user wishes to register as.
   * @return bool True if the user meets the invitation criteria for registration, false otherwise.
   */
  function invitedTypeOnRegister(address addr, UserType userType) internal view returns (bool) {
    if (!userTypeSettings[userType].needInvitationOnRegister) return true;

    Invitation memory invitation = invitations[addr];

    return invitation.createdAtBlock > 0 && invitation.userType == userType;
  }

  /**
   * @dev Checks if registration for a specific user type is allowed based on proportionality rules.
   * @param userType The `UserType` for which registration is being checked.
   * @return bool True if registration is allowed according to proportionality, false otherwise.
   */
  function registrationProportionalityAllowed(UserType userType) internal view returns (bool) {
    uint256 regeneratorsCount = userTypesCount[UserType.REGENERATOR];
    uint256 registeredUserTypeCount = userTypesCount[userType];
    UserTypeSetting memory setting = userTypeSettings[userType];
    uint256 proportionality = setting.proportionalityOnRegister;

    // If proportionality is 0, no limit applies.
    if (proportionality == 0) return true;
    // Allow registration if below a minimum quantity for this user type, regardless of proportionality.
    if (registeredUserTypeCount < MINIMUM_REGISTERED_USERS_QUANTITY) return true;

    // Apply direct multiplication proportionality.
    if (setting.directProportionalityRegistration) return registeredUserTypeCount < regeneratorsCount * proportionality;
    // Apply inverse division proportionality.
    return registeredUserTypeCount <= regeneratorsCount / proportionality;
  }

  // --- View Functions ---

  /**
   * @notice Returns the total count of users currently classified as voters.
   * @dev Sums the active counts of Activist, Contributor, Developer, and Researcher user types.
   * @return uint256 The total number of voters.
   */
  function votersCount() public view returns (uint256) {
    return
      userTypesCount[UserType.ACTIVIST] +
      userTypesCount[UserType.CONTRIBUTOR] +
      userTypesCount[UserType.DEVELOPER] +
      userTypesCount[UserType.RESEARCHER];
  }

  /**
   * @notice Checks if a given address belongs to a user type that is considered a voter.
   * @param addr The address of the user to check.
   * @return bool True if the user is a voter, false otherwise.
   */
  function isVoter(address addr) public view returns (bool) {
    return getUserTypeSettings(users[addr]).isVoter;
  }

  /**
   * @notice Returns the `UserType` of a given address.
   * @param addr The address to query.
   * @return UserType The `UserType` enum value associated with the address.
   */
  function getUser(address addr) public view returns (UserType) {
    return users[addr];
  }

  /**
   * @notice Returns the `UserTypeSetting` configuration for a specific `UserType`.
   * @param userType The `UserType` to query settings for.
   * @return UserTypeSetting The `UserTypeSetting` struct containing configuration data.
   */
  function getUserTypeSettings(UserType userType) public view returns (UserTypeSetting memory) {
    return userTypeSettings[userType];
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
