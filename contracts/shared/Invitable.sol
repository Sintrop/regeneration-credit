// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title Invitable
 * @author Sintrop
 * @notice Contract to determine if a user is eligible to send invitations based on their levels
 * relative to the average of his group.
 * @dev Contains a pure function to perform this check.
 */
contract Invitable {
  /**
   * @dev The threshold of total users below (or equal to) which any user can invite.
   * This allows for easier invitations in the early stages of the system.
   */
  uint256 public constant INITIAL_USER_COUNT_THRESHOLD = 5;

  /**
   * @notice Checks if a user is eligible to send an invitation.
   * @dev Eligibility rules:
   * 1. If the total number of users in the system is less than or equal to `INITIAL_USER_COUNT_THRESHOLD`,
   * any user can invite (returns true).
   * 2. Otherwise, a user can invite if their `userLevels` are greater than or equal to the
   * average levels per user plus one (`avg = (totalLevels / totalUsers) + 1`).
   * @param totalLevels The total levels accumulated by all users of a specific type in the system.
   * @param totalUsers  The total number of users of a specific type registered in the system.
   * @param userLevels The total levels of the specific user wishing to invite.
   * @return bool True if the user can invite, false otherwise.
   */
  function canInvite(uint256 totalLevels, uint256 totalUsers, uint256 userLevels) public pure returns (bool) {
    // If there are no users, no one can invite. This also prevents totalUsers from being zero in the calculation.
    if (totalUsers == 0) {
      return false;
    }

    // Rule 1: Allow anyone to invite if the system has few users.
    if (totalUsers <= INITIAL_USER_COUNT_THRESHOLD) {
      return true;
    }

    // Rule 2: Check if the user's level is strictly greater than the average.
    return userLevels * totalUsers > totalLevels;
  }
}
