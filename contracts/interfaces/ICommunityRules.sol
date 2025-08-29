// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { CommunityTypes } from "./../types/CommunityTypes.sol";

/**
 * @title ICommunityRules
 * @notice Interface for the CommunityRules contract, which manages the rules for users.
 */
interface ICommunityRules {
  /**
   * @notice Returns the count of a specific user type.
   * @dev Getter for the public state variable `mapping(UserType => uint256) public userTypesCount`.
   * @param userType The user type to query.
   * @return The count of users for that type.
   */
  function userTypesCount(CommunityTypes.UserType userType) external view returns (uint256);

  /**
   * @notice Returns the total count of a user type (used for generating IDs).
   * @dev Getter for the public state variable `mapping(UserType => uint64) public userTypesTotalCount`.
   * @param userType The user type to query.
   * @return The total count for that type.
   */
  function userTypesTotalCount(CommunityTypes.UserType userType) external view returns (uint64);

  /**
   * @notice Adds a new user to the system with a specific type.
   * @param user The address of the new user.
   * @param userType The type to be assigned to the new user.
   */
  function addUser(address user, CommunityTypes.UserType userType) external;

  /**
   * @notice Checks if a user is of a specific type.
   * @param userType The user type to check against.
   * @param user The address of the user to check.
   * @return bool true if the user is of the specified type, false otherwise.
   */
  function userTypeIs(CommunityTypes.UserType userType, address user) external view returns (bool);

  /**
   * @notice Checks if a user is denied.
   * @param user The address of the user to check.
   * @return bool if the user is denied, so true, false otherwise.
   */
  function isDenied(address user) external view returns (bool);

  /**
   * @notice Gets the invitation data for a specific address.
   * @param userAddress The address of the invited user.
   * @return The Invitation struct containing the invitation data.
   */
  function getInvitation(address userAddress) external view returns (CommunityTypes.Invitation memory);

  /**
   * @notice Retrieves the UserType for a given account.
   * @param account The address of the user.
   * @return The user's UserType enum.
   */
  function getUser(address account) external view returns (CommunityTypes.UserType);

  /**
   * @notice Adds a new invitation to the system.
   * @param inviter The user who is sending the invitation.
   * @param invitee The user who is being invited.
   * @param userType The UserType being assigned in the invitation.
   */
  function addInvitation(address inviter, address invitee, CommunityTypes.UserType userType) external;

  /**
   * @notice Retrieves the settings configuration for a specific UserType.
   * @dev Returns a struct from which specific settings can be accessed.
   * @param userType The UserType for which to get the settings.
   * @return The UserTypeSettings struct containing configuration data.
   */
  function getUserTypeSettings(
    CommunityTypes.UserType userType
  ) external view returns (CommunityTypes.UserTypeSetting memory);

  /**
   * @notice Sets a user's type to a 'denied' or 'invalid' state.
   * @param account The address of the user to be denied.
   */
  function setToDenied(address account) external;

  /**
   * @notice Returns the total number of users eligible to vote.
   * @dev This might be a getter for a public state variable.
   * @return The total count of voters.
   */
  function votersCount() external view returns (uint256);

  /**
   * @notice Checks if a given account has voting rights.
   * @param account The address of the account to check.
   * @return true if the account is a voter, false otherwise.
   */
  function isVoter(address account) external view returns (bool);

  /**
   * @notice Function to add inviter penalties when invited user is denied.
   * @param inviter The address of the account the inviter to receive penalty.
   */
  function addInviterPenalty(address inviter) external;

  /**
   * @notice Returns the total count of invitation penalties of a user.
   * @dev Getter for the public state variable `mapping(address => uint16) public inviterPenalties`.
   * @param addr The user address.
   * @return The total count of penlaties for that user.
   */
  function inviterPenalties(address addr) external view returns (uint16);
}
