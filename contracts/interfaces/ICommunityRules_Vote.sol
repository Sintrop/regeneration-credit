// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/CommunityTypes.sol";

/**
 * @title ICommunityRules_Vote
 * @notice Interface for the voting-related query functionalities of the
 * CommunityRules contract.
 */
interface ICommunityRules_Vote {
  /**
   * @notice Checks if a given account has voting rights.
   * @param account The address of the account to check.
   * @return true if the account is a voter, false otherwise.
   */
  function isVoter(address account) external view returns (bool);

  /**
   * @notice Retrieves the UserType for a given account.
   * @param account The address of the user.
   * @return The user's UserType enum.
   */
  function getUser(address account) external view returns (UserType);

  /**
   * @notice Returns the total count of a user type (used for generating IDs).
   * @dev Getter for the public state variable `mapping(UserType => uint64) public userTypesTotalCount`.
   * @param userType The user type to query.
   * @return The total count for that type.
   */
  function userTypesTotalCount(UserType userType) external view returns (uint64);
}
