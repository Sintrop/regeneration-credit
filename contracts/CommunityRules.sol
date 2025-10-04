// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";

/**
 * @title CommunityRules
 * @author Sintrop
 * @notice This contract serves as the central registry for user management within the community.
 * It manages user types, registration processes, invitation mechanisms, and a delation system for reporting unwanted behavior.
 * @dev Inherits from `Ownable` for deploy setup and `Callable` for restricting access to sensitive functions
 * to whitelisted addresses. It defines critical parameters and logic for user onboarding and community governance.
 */
contract CommunityRules is Callable {
  // --- Constants ---

  /// @notice Minimum number of users allowed for a specific type before proportionality rules apply.
  uint16 private constant MINIMUM_REGISTERED_USERS_QUANTITY = 5;

  /// @notice The maximum allowed amount of invalidated invited users.
  uint16 private constant MAX_INVITER_PENALTIES = 5;

  /// @notice The number of blocks an invitation is delayed for Supporters.
  uint32 public constant SUPPORTER_INVITATION_DELAY_BLOCKS = 150;

  /// @notice The number of blocks an invitation is delayed for voter-type users.
  uint32 public constant VOTER_INVITATION_DELAY_BLOCKS = 100000;

  /// @notice The number of blocks a user must wait between submitting delations.
  uint256 private constant BLOCKS_BETWEEN_DELATIONS = 500;

  /// @notice Max character length for delation titles.
  uint16 private constant MAX_TITLE_LENGTH = 100;

  /// @notice Max character length for delation testimonies.
  uint16 private constant MAX_TESTIMONY_LENGTH = 300;

  // --- State variables ---

  /// @notice Total count of delations received across all users.
  uint64 public delationsCount;

  /// @notice The global total count of all active (non-`UNDEFINED`) users in the system..
  uint64 public usersCount;

  /// @notice A mapping from a user's wallet address to their assigned `UserType`.
  mapping(address => CommunityTypes.UserType) private users;

  /// @notice A mapping from a user's wallet address to denied status.
  mapping(address => bool) private deniedUsers;

  /// @notice A mapping from a reported user's address to an array of `Delation` structs they have received.
  /// Stores a historical record of all delations against a user.
  mapping(address => CommunityTypes.Delation[]) private delations;

  /// @dev Index of delation IDs for each reported user.
  mapping(address => uint64[]) private _delationIdsForUser;

  /// @notice A mapping from a delation id to the `Delation` struct.
  mapping(uint256 => CommunityTypes.Delation) public delationsById;

  /// @notice Tracks which user has voted on which delation to prevent double voting.
  /// @dev mapping: delationId => voterAddress => hasVoted (bool)
  mapping(uint64 => mapping(address => bool)) private _hasVotedOnDelation;

  /// @notice A mapping from an invited user's address to their `Invitation` details.
  mapping(address => CommunityTypes.Invitation) public invitations;

  /// @notice A mapping to track the count of active users for each `UserType`.
  mapping(CommunityTypes.UserType => uint64) public userTypesCount;

  /// @notice A mapping to track the total count of registered users for each `UserType`,
  /// including both active and `DENIED` users. This count serves as a global counter for new user IDs.
  mapping(CommunityTypes.UserType => uint64) public userTypesTotalCount;

  /// @notice A mapping storing specific settings for each `UserType`,
  /// including proportionality rules, invitation requirements, and voter status.
  mapping(CommunityTypes.UserType => CommunityTypes.UserTypeSetting) public userTypeSettings;

  /// @notice Tracks the number of times an inviter has had their invitees denied.
  mapping(address => uint16) public inviterPenalties;

  /// @notice Tracks the block number of each user's last submitted delation.
  mapping(address => uint256) public lastDelationBlock;

  /// @notice Tracks which user has already submitted a delation against another to prevent spam.
  mapping(address => mapping(address => bool)) private _hasDelated;

  /// @notice The address of the `InvitationRules` contract.
  address public invitationRulesAddress;

  /// @notice The address of the `InvitationRules` contract.
  address public validationRulesAddress;

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
    uint8 inspectorProportionality,
    uint8 activistProportionality,
    uint8 researcherProportionality,
    uint8 developerProportionality,
    uint8 contributorProportionality
  ) {
    // Initialize settings for all relevant UserTypes
    userTypeSettings[CommunityTypes.UserType.SUPPORTER] = CommunityTypes.UserTypeSetting(
      0,
      false,
      false,
      SUPPORTER_INVITATION_DELAY_BLOCKS,
      false
    );
    userTypeSettings[CommunityTypes.UserType.REGENERATOR] = CommunityTypes.UserTypeSetting(0, false, true, 0, false);
    userTypeSettings[CommunityTypes.UserType.INSPECTOR] = CommunityTypes.UserTypeSetting(
      inspectorProportionality,
      true,
      true,
      0,
      false
    );
    userTypeSettings[CommunityTypes.UserType.ACTIVIST] = CommunityTypes.UserTypeSetting(
      activistProportionality,
      false,
      true,
      VOTER_INVITATION_DELAY_BLOCKS,
      false
    );
    userTypeSettings[CommunityTypes.UserType.RESEARCHER] = CommunityTypes.UserTypeSetting(
      researcherProportionality,
      false,
      true,
      VOTER_INVITATION_DELAY_BLOCKS,
      true
    );
    userTypeSettings[CommunityTypes.UserType.DEVELOPER] = CommunityTypes.UserTypeSetting(
      developerProportionality,
      false,
      true,
      VOTER_INVITATION_DELAY_BLOCKS,
      true
    );
    userTypeSettings[CommunityTypes.UserType.CONTRIBUTOR] = CommunityTypes.UserTypeSetting(
      contributorProportionality,
      false,
      true,
      VOTER_INVITATION_DELAY_BLOCKS,
      true
    );
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _invitationRulesAddress Address of InvitationRules.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _invitationRulesAddress, address _validationRulesAddress) external onlyOwner {
    invitationRulesAddress = _invitationRulesAddress;
    validationRulesAddress = _validationRulesAddress;
  }

  // --- Public functions (State Modifying) ---

  /**
   * @dev Adds a new delation to the system. Enforces character limits for title and testimony, and requires both reporter and reported user to be registered.
   * @notice Allows registered users (excluding Supporters) to report other users or resources that may require invalidation.
   * Limited to one delation per target.
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
   * @param title Title of the delation (Max 100 characters).
   * @param testimony Justification/details of the delation (Max 300 characters).
   */
  function addDelation(address addr, string memory title, string memory testimony) external {
    require(
      bytes(title).length <= MAX_TITLE_LENGTH && bytes(testimony).length <= MAX_TESTIMONY_LENGTH,
      "Max characters reached"
    );
    require(!isDenied(msg.sender), "User denied");
    require(hasWaitedRequiredTime(msg.sender), "Wait delay blocks");
    require(users[msg.sender] != CommunityTypes.UserType.UNDEFINED, "Caller must be registered");
    require(users[msg.sender] != CommunityTypes.UserType.SUPPORTER, "Not allowed to supporters");
    require(users[addr] != CommunityTypes.UserType.UNDEFINED, "User must be registered");
    require(addr != address(0), "Cannot delate zero address");
    require(addr != msg.sender, "Self-denunciation not allowed");
    require(!_hasDelated[msg.sender][addr], "Already submitted");

    _hasDelated[msg.sender][addr] = true;
    lastDelationBlock[msg.sender] = block.number;

    delationsCount++;
    uint64 newDelationId = delationsCount;

    CommunityTypes.Delation memory newDelation = CommunityTypes.Delation(
      newDelationId,
      msg.sender,
      addr,
      title,
      testimony,
      block.number,
      0,
      0
    );

    _delationIdsForUser[addr].push(newDelationId);
    delations[addr].push(newDelation);
    delationsById[newDelationId] = newDelation;

    emit DelationAdded(msg.sender, addr, newDelationId);
  }

  /**
   * @notice Allows users to vote (true/false) on an existing delation.
   * @dev This creates a social validation layer. Voters cannot be the informer or the reported user.
   * @param _delationId The ID of the delation to vote on.
   * @param _supportsDelation True for a "thumbs up" (agrees), false for "thumbs down" (disagrees).
   */
  function voteOnDelation(uint64 _delationId, bool _supportsDelation) external {
    // 1. Check if the delation exists by accessing it. It will revert if the ID is invalid.
    CommunityTypes.Delation storage delation = delationsById[_delationId];
    require(delation.id != 0, "Delation does not exist");

    // 2. Check if the voter is eligible.
    require(users[msg.sender] != CommunityTypes.UserType.UNDEFINED, "Caller must be registered");
    require(users[msg.sender] != CommunityTypes.UserType.SUPPORTER, "Not allowed to supporters");
    require(!isDenied(msg.sender), "User denied");

    // 3. The informer and the reported user cannot vote on their own delation.
    require(msg.sender != delation.informer, "Informer cannot vote");
    require(msg.sender != delation.reported, "Reported user cannot vote");

    // 4. Check to prevent double voting.
    require(!_hasVotedOnDelation[_delationId][msg.sender], "Already voted");

    // --- State Changes ---

    // Mark that this user has now voted.
    _hasVotedOnDelation[_delationId][msg.sender] = true;

    // Increment the appropriate counter.
    if (_supportsDelation) {
      delation.thumbsUp++;
    } else {
      delation.thumbsDown++;
    }

    emit DelationVoted(_delationId, msg.sender, _supportsDelation, delation.thumbsUp, delation.thumbsDown);
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @notice Adds a new user to the system with a specified user type.
   * @dev This function can only be called by an allowed caller (e.g., specific *Rules contracts for each user type).
   * It enforces rules for single registration per address, valid user types, proportionality limits, and valid invitations if required.
   * @param addr The address of the user to be registered.
   * @param userType The desired `UserType` for the user.
   */
  function addUser(address addr, CommunityTypes.UserType userType) external mustBeAllowedCaller {
    require(addr != address(0), "User address cannot be zero");
    require(users[addr] == CommunityTypes.UserType.UNDEFINED, "User already exists"); // Only one registration per address
    require(userType != CommunityTypes.UserType.UNDEFINED, "Invalid user type"); // Must selected the appropriate userType
    require(_registrationProportionalityAllowed(userType), "Proportionality invalid"); // Vacancies according to the number of regenerators
    require(_invitedTypeOnRegister(addr, userType), "Invalid invitation"); // Only with valid invitation
    require(!isDenied(invitations[addr].inviter), "Inviter denied"); // Inviter cannot be denied
    require(inviterPenalties[invitations[addr].inviter] < MAX_INVITER_PENALTIES, "Inviter with too many penalties"); // Inviter cannot exceed penalties

    users[addr] = userType;
    usersCount++;
    userTypesCount[userType]++;
    userTypesTotalCount[userType]++;

    emit UserRegistered(addr, userType);
  }

  /**
   * @notice Attempts to add an invitation for a new user.
   * @dev This function is intended to be called by an allowed caller, the Invitation Rules.
   * It records an invitation for a specific user to register as a certain user type.
   * Prevents re-inviting an already invited or registered address.
   * @param inviter The address of the user who issued the invitation.
   * @param invited The address of the user who received the invitation.
   * @param userType The `UserType` the `invited` user is intended to register as.
   */
  function addInvitation(
    address inviter,
    address invited,
    CommunityTypes.UserType userType
  ) external mustBeAllowedCaller mustBeContractCall(invitationRulesAddress) {
    require(invited != address(0), "Invited address cannot be zero");
    require(invitations[invited].invited == address(0), "Already invited");
    require(users[invited] == CommunityTypes.UserType.UNDEFINED, "Already registered");
    require(userType != CommunityTypes.UserType.UNDEFINED, "Invalid user type for invitation");

    invitations[invited] = CommunityTypes.Invitation(invited, inviter, userType, block.number);

    emit InvitationAdded(inviter, invited, userType);
  }

  /**
   * @notice Sets a user's to `DENIED`.
   * @dev This function is intended to be called by an allowed caller (`ValidationRules`).
   * It decrements the count of the user's previous type and sets their `UserType` to `DENIED`.
   * Prevents re-denying an already denied user.
   * @param userAddress The address of the user to be denied.
   */
  function setToDenied(address userAddress) external mustBeAllowedCaller {
    if (deniedUsers[userAddress]) return;

    userTypesCount[users[userAddress]]--; // Decrement count of the old user type

    deniedUsers[userAddress] = true;

    emit DeniedUserEvent(userAddress);
  }

  /**
   * @notice This functions adds a penalty to users when a invited user gets denied.
   * @dev This function is intended to be called by an allowed caller (`ValidationRules`).
   * It decrements the count of penalties for the inviter.
   * @param inviter The address of the inviter receiving the penalty.
   */
  function addInviterPenalty(address inviter) external mustBeAllowedCaller {
    inviterPenalties[inviter]++;
  }

  // --- Private functions ---

  /**
   * @dev Checks if a user can register with a specific user type based on invitation requirements.
   * @param addr The address of the user attempting to register.
   * @param userType The `UserType` the user wishes to register as.
   * @return bool True if the user meets the invitation criteria for registration, false otherwise.
   */
  function _invitedTypeOnRegister(address addr, CommunityTypes.UserType userType) private view returns (bool) {
    // If the UserType does not require an invitation for registration, return true.
    if (!userTypeSettings[userType].needInvitationOnRegister) return true;

    // Retrieve the invitation details for the given address.
    CommunityTypes.Invitation memory invitation = invitations[addr];

    // Check if an invitation exists for the address and if the invitation's userType matches the requested userType.
    // An invitation exists if `createdAtBlock` is greater than 0.
    return invitation.createdAtBlock > 0 && invitation.userType == userType;
  }

  /**
   * @dev Checks if registration for a specific user type is allowed based on proportionality rules.
   * @param userType The `UserType` for which registration is being checked.
   * @return bool True if registration is allowed according to proportionality, false otherwise.
   */
  function _registrationProportionalityAllowed(CommunityTypes.UserType userType) private view returns (bool) {
    uint64 regeneratorsCount = userTypesCount[CommunityTypes.UserType.REGENERATOR];
    uint64 registeredUserTypeCount = userTypesCount[userType];
    CommunityTypes.UserTypeSetting memory setting = userTypeSettings[userType];
    uint8 proportionality = setting.proportionalityOnRegister;

    // If proportionality is 0, no limit applies.
    if (proportionality == 0) return true;
    // Allow registration if below a minimum quantity for this user type, regardless of proportionality.
    if (registeredUserTypeCount < MINIMUM_REGISTERED_USERS_QUANTITY) return true;

    // Apply direct multiplication proportionality.
    if (setting.directProportionalityRegistration) return registeredUserTypeCount < regeneratorsCount * proportionality;

    return registeredUserTypeCount <= regeneratorsCount / proportionality;
  }

  // --- View functions ---

  /**
   * @notice Returns the total count of users currently classified as voters.
   * @dev Sums the active counts of Activist, Contributor, Developer, and Researcher user types.
   * @return uint256 The total number of voters.
   */
  function votersCount() public view returns (uint256) {
    return
      userTypesCount[CommunityTypes.UserType.ACTIVIST] +
      userTypesCount[CommunityTypes.UserType.CONTRIBUTOR] +
      userTypesCount[CommunityTypes.UserType.DEVELOPER] +
      userTypesCount[CommunityTypes.UserType.RESEARCHER];
  }

  /**
   * @notice Checks if a given address belongs to a user type that is considered a voter.
   * @param addr The address of the user to check.
   * @return bool True if the user is a voter, false otherwise.
   */
  function isVoter(address addr) public view returns (bool) {
    if (deniedUsers[addr]) return false;

    return getUserTypeSettings(users[addr]).isVoter;
  }

  /**
   * @notice Returns the `UserType` of a given address.
   * @param addr The address to query.
   * @return UserType The `UserType` enum value associated with the address.
   */
  function getUser(address addr) public view returns (CommunityTypes.UserType) {
    return users[addr];
  }

  /**
   * @notice Returns the `UserTypeSetting` configuration for a specific `UserType`.
   * @param userType The `UserType` to query settings for.
   * @return UserTypeSetting The `UserTypeSetting` struct containing configuration data.
   */
  function getUserTypeSettings(
    CommunityTypes.UserType userType
  ) public view returns (CommunityTypes.UserTypeSetting memory) {
    return userTypeSettings[userType];
  }

  /**
   * @notice Function to check if an userAddress type is equal passed userType.
   * @dev This function also checks if a user is denied, returning false if denied.
   * @param userType The `UserType` to check for.
   * @param userAddress Denied user address.
   * @return bool True if userAddress is equal userType.
   */
  function userTypeIs(CommunityTypes.UserType userType, address userAddress) public view returns (bool) {
    return users[userAddress] == userType && !deniedUsers[userAddress];
  }

  /**
   * @notice Function to check if an userAddress is denied.
   * @param userAddress The user address to check.
   * @return bool True if userAddress is denied.
   */
  function isDenied(address userAddress) public view returns (bool) {
    return deniedUsers[userAddress];
  }

  /**
   * @notice Gets the unique IDs of all delations filed against a user.
   * @dev This function returns an array of IDs. The full data for each delation
   * can then be fetched individually from the public `delationsById` mapping.
   * @param _user The address of the user whose delation IDs are to be retrieved.
   * @return An array of `uint64` delation IDs.
   */
  function getUserDelations(address _user) external view returns (uint64[] memory) {
    return _delationIdsForUser[_user];
  }

  /**
   * @dev Returns the invitation.
   * @notice Get the invitation of a user.
   * @param addr User address.
   * @return the Invitation data struct.
   */
  function getInvitation(address addr) external view returns (CommunityTypes.Invitation memory) {
    return invitations[addr];
  }

  /**
   * @dev Calculates if a user is eligible to publish a delation.
   * Eligibility based on the `lastDelationBlock` and `BLOCKS_BETWEEN_DELATIONS`.
   * @param addr The address to check.
   * @return `true` if the user can publish, `false` otherwise.
   */
  function hasWaitedRequiredTime(address addr) public view returns (bool) {
    return lastDelationBlock[addr] == 0 || block.number > lastDelationBlock[addr] + BLOCKS_BETWEEN_DELATIONS;
  }

  // --- Events ---

  /**
   * @notice Emitted when a new user is successfully added to the system.
   * @param addr The address of the newly registered user.
   * @param userType The `UserType` assigned to the new user.
   */
  event UserRegistered(address indexed addr, CommunityTypes.UserType userType);

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
  event DelationAdded(address indexed informer, address indexed reported, uint64 newDelationId);

  /**
   * @notice Emitted when an invitation is successfully added to the system.
   * @param inviter The address of the user who issued the invitation.
   * @param invited The address of the user who received the invitation.
   * @param userTypeTo The `UserType` the invited user is intended to register as.
   */
  event InvitationAdded(address indexed inviter, address indexed invited, CommunityTypes.UserType userTypeTo);

  /**
   * @notice Emitted when a user votes on a delation.
   * @param delationId The ID of the delation that was voted on.
   * @param voter The address of the user who voted.
   * @param supportsDelation True if the vote was a "thumbs up", false for "thumbs down".
   * @param newThumbsUpCount The new total of "thumbs up" votes for this delation.
   * @param newThumbsDownCount The new total of "thumbs down" votes for this delation.
   */
  event DelationVoted(
    uint64 indexed delationId,
    address indexed voter,
    bool supportsDelation,
    uint256 newThumbsUpCount,
    uint256 newThumbsDownCount
  );
}
