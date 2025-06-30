// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import "contracts/types/CommunityTypes.sol";

/**
 * @title ICommunityRules_Inspection
 * @notice Interface for the CommunityRules contract, which manages the rules for users.
 */
interface ICommunityRules_Inspection {
  /**
   * @notice Checks if a user is of a specific type.
   * @param userType The user type to check against.
   * @param user The address of the user to check.
   * @return true if the user is of the specified type, false otherwise.
   */
  function userTypeIs(UserType userType, address user) external view returns (bool);
}
