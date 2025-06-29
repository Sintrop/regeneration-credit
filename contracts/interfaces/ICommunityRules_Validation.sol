// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/CommunityTypes.sol";

/**
 * @title ICommunityRules_Validation
 * @notice Interface for the validation-related functionalities of the
 * CommunityRules contract, used for checking and updating user status.
 */
interface ICommunityRules_Validation {
  /**
   * @notice Checks if a user is of a specific type.
   * @param userType The user type to check against.
   * @param account The address of the user to check.
   * @return true if the user is of the specified type, false otherwise.
   */
  function userTypeIs(UserType userType, address account) external view returns (bool);

  /**
   * @notice Retrieves the UserType for a given account.
   * @param account The address of the user.
   * @return The user's UserType enum.
   */
  function getUser(address account) external view returns (UserType);

  /**
   * @notice Sets a user's type to a 'denied' or 'invalid' state.
   * @param account The address of the user to be denied.
   */
  function setDeniedType(address account) external;

  /**
   * @notice Returns the total number of users eligible to vote.
   * @dev This might be a getter for a public state variable.
   * @return The total count of voters.
   */
  function votersCount() external view returns (uint256);
}
