// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { Contribution } from "contracts/types/ContributorTypes.sol";
import { Report } from "contracts/types/DeveloperTypes.sol";
import { Research } from "contracts/types/ResearcherTypes.sol";
import { Inspection } from "contracts/types/InspectionTypes.sol";

/**
 * @title IValidationRules
 * @notice Interface for the ValidationRules contract, which manages the rules
 * for validating or invalidating user-submitted content.
 */
interface IValidationRules {
  /**
   * @notice Checks if a user has waited the required time since their last vote.
   * @param account The address of the user (voter).
   * @return true if the user is allowed to vote, false otherwise.
   */
  function waitedTimeBetweenVotes(address account) external view returns (bool);

  /**
   * @notice Returns the number of votes required to invalidate a user or resource.
   * @dev An explicit function that calculates and retrieves the invalidation threshold.
   * @return The required number of votes.
   */
  function votesToInvalidate() external view returns (uint256);

  /**
   * @dev Function to updade validator last vote block.number.
   */
  function updateValidatorLastVoteBlock(address validatorAddress) external;

  /**
   * @dev Function to updade voter validationPoints.
   */
  function addValidationPoint(address validatorAddress) external;
}
