// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/CommunityTypes.sol";

/**
 * @title ICommunityRules_Invitation
 * @notice Interface for the invitation-related functionalities of the
 * CommunityRules contract.
 */
interface ICommunityRules_Invitation {
  /**
   * @notice Retrieves the UserType for a given account.
   * @param account The address of the user.
   * @return The user's UserType enum.
   */
  function getUser(address account) external view returns (UserType);

  /**
   * @notice Adds a new invitation to the system.
   * @param inviter The user who is sending the invitation.
   * @param invitee The user who is being invited.
   * @param userType The UserType being assigned in the invitation.
   */
  function addInvitation(address inviter, address invitee, UserType userType) external;

  /**
   * @notice Checks if a user is of a specific type.
   * @param userType The user type to check against.
   * @param account The address of the user to check.
   * @return true if the user is of the specified type, false otherwise.
   */
  function userTypeIs(UserType userType, address account) external view returns (bool);

  /**
   * @notice Retrieves the settings configuration for a specific UserType.
   * @dev Returns a struct from which specific settings can be accessed.
   * @param userType The UserType for which to get the settings.
   * @return The UserTypeSettings struct containing configuration data.
   */
  function getUserTypeSettings(UserType userType) external view returns (UserTypeSetting memory);
}
