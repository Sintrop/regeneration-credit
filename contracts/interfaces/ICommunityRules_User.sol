// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/CommunityTypes.sol";

/**
 * @title ICommunityRules_User
 * @notice Interface for the CommunityRules contract, which manages the rules for users.
 */
interface ICommunityRules_User {
  /**
   * @notice Returns the count of a specific user type.
   * @dev Getter for the public state variable `mapping(UserType => uint256) public userTypesCount`.
   * @param userType The user type to query.
   * @return The count of users for that type.
   */
  function userTypesCount(UserType userType) external view returns (uint256);

  /**
   * @notice Returns the total count of a user type (used for generating IDs).
   * @dev Getter for the public state variable `mapping(UserType => uint64) public userTypesTotalCount`.
   * @param userType The user type to query.
   * @return The total count for that type.
   */
  function userTypesTotalCount(UserType userType) external view returns (uint64);

  /**
   * @notice Adds a new user to the system with a specific type.
   * @param user The address of the new user.
   * @param userType The type to be assigned to the new user.
   */
  function addUser(address user, UserType userType) external;

  /**
   * @notice Checks if a user is of a specific type.
   * @param userType The user type to check against.
   * @param user The address of the user to check.
   * @return true if the user is of the specified type, false otherwise.
   */
  function userTypeIs(UserType userType, address user) external view returns (bool);

  /**
   * @notice Gets the invitation data for a specific address.
   * @param userAddress The address of the invited user.
   * @return The Invitation struct containing the invitation data.
   */
  function getInvitation(address userAddress) external view returns (Invitation memory);
}
