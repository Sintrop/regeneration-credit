// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

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

  function updateValidatorLastVoteBlock(address validatorAddress) external;

  /**
   * @notice Adds a validation vote to a specific contribution.
   * @param contribution The full Contribution struct being validated.
   * @param justification A string explaining the reason for the vote.
   * @param validator The address of the user who is voting.
   */
  function addContributionValidation(
    Contribution memory contribution,
    string memory justification,
    address validator
  ) external;

  // /**
  //  * @notice Adds a validation vote to a specific report.
  //  * @param report The full Report struct being validated.
  //  * @param justification A string explaining the reason for the vote.
  //  * @param validator The address of the user who is voting.
  //  */
  // function addReportValidation(Report memory report, string memory justification, address validator) external;

  /**
   * @notice Adds a validation vote to a specific inspection item.
   * @param inspection The full Inspection struct being validated.
   * @param justification A string explaining the reason for the vote.
   * @param validator The address of the user who is voting.
   */
  function addInspectionValidation(
    Inspection memory inspection,
    string memory justification,
    address validator
  ) external;

  /**
   * @notice Adds a validation vote to a specific research item.
   * @param research The full Research struct being validated.
   * @param justification A string explaining the reason for the vote.
   * @param validator The address of the user who is voting.
   */
  function addResearchValidation(Research memory research, string memory justification, address validator) external;
}
