// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IActivistRules } from "./interfaces/IActivistRules.sol";
import { IContributorRules } from "./interfaces/IContributorRules.sol";
import { IDeveloperRules } from "./interfaces/IDeveloperRules.sol";
import { IResearcherRules } from "./interfaces/IResearcherRules.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Activist } from "./types/ActivistTypes.sol";
import { Contributor } from "./types/ContributorTypes.sol";
import { Developer } from "./types/DeveloperTypes.sol";
import { Researcher } from "./types/ResearcherTypes.sol";

/**
 * @title VoteRules
 * @author Sintrop
 * @notice Defines the rules and logic for determining if a user is eligible to vote for invalidation.
 * @dev This contract calculates voting eligibility based on a user's levels relative to their user type's average levels.
 */
contract VoteRules {
  // --- Constant ---

  /**
   * @dev The threshold of total users below (or equal to) which any user can invite.
   * This allows for easier invitations in the early stages of the system.
   */
  uint256 public constant INITIAL_USER_COUNT_THRESHOLD = 5;

  // --- State variables ---

  /// @notice CommunityRules contract interface.
  ICommunityRules public communityRules;

  /// @notice ContributorRules contract interface.
  IContributorRules public contributorRules;

  /// @notice DeveloperRules contract interface.
  IDeveloperRules public developerRules;

  /// @notice ResearcherRules contract interface.
  IResearcherRules public researcherRules;

  // --- Constructor ---

  /**
   * @dev Initializes the contract with the addresses of the various rule contracts.
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param contributorRulesAddress Address of the ContributorRules contract.
   * @param developerRulesAddress Address of the DeveloperRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract.
   */
  constructor(
    address communityRulesAddress,
    address contributorRulesAddress,
    address developerRulesAddress,
    address researcherRulesAddress
  ) {
    communityRules = ICommunityRules(communityRulesAddress);
    contributorRules = IContributorRules(contributorRulesAddress);
    developerRules = IDeveloperRules(developerRulesAddress);
    researcherRules = IResearcherRules(researcherRulesAddress);
  }

  // --- Public functions ---

  /**
   * @notice Checks if a given address is eligible to send a vote based on predefined rules.
   * @dev This function calculates a user's eligibility by comparing their levels to the average levels of their user type.
   * It also requires the user to be designated as a 'voter' in CommunityRules.
   * @param addr The address of the user to check.
   * @return bool True if the user can vote, false otherwise.
   */
  function canVote(address addr) public view returns (bool) {
    require(communityRules.isVoter(addr), "Not a voter user");

    CommunityTypes.UserType userType = communityRules.getUser(addr);
    uint256 totalUsers = communityRules.userTypesCount(userType);

    return _canVoteRules(_totalLevels(userType), totalUsers, _totalUserLevels(addr, userType));
  }

  // --- Private functions ---

  /**
   * @notice Determines voting eligibility based on user levels relative to type average.
   * @dev Calculates if a user's levels meet or exceed the average levels of their user type.
   * For user types with 5 or fewer total users, all are considered eligible.
   * @param totalTypeLevels Total levels for the specific user type across the system.
   * @param totalUsers Total number of users of the specific type registered in the system.
   * @param userLevels Total levels of the individual user.
   * @return bool True if the user meets the voting criteria, false otherwise.
   */
  function _canVoteRules(uint256 totalTypeLevels, uint256 totalUsers, uint256 userLevels) private pure returns (bool) {
    // Edge case: If there are no users, no one can vote.
    if (totalUsers == 0) {
      return false;
    }

    // Rule 1: Allow anyone to vote if the user type has few members.
    if (totalUsers <= INITIAL_USER_COUNT_THRESHOLD) return true;

    // Rule 2: Check if the user's level is strictly greater than the average
    return userLevels * totalUsers > totalTypeLevels;
  }

  /**
   * @notice Calculates the total pool levels for a specific user.
   * @dev Retrieves the 'level' from the 'pool' struct associated with the given user's address and user type.
   * Returns 0 if the user type is not recognized or has no associated levels.
   * @param addr The address of the user to check.
   * @param userType The UserType of the user.
   * @return levels Total levels for the given address.
   */
  function _totalUserLevels(address addr, CommunityTypes.UserType userType) private view returns (uint256) {
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) {
      Contributor memory user = contributorRules.getContributor(addr);

      return user.pool.level;
    } else if (userType == CommunityTypes.UserType.DEVELOPER) {
      Developer memory user = developerRules.getDeveloper(addr);

      return user.pool.level;
    } else if (userType == CommunityTypes.UserType.RESEARCHER) {
      Researcher memory user = researcherRules.getResearcher(addr);

      return user.pool.level;
    } else {
      return 0;
    }
  }

  /**
   * @notice Calculates the total aggregated levels for a specific user type across the system.
   * @dev Sums up levels based on specific metrics for each UserType (e.g., approved reports for Developers).
   * Returns 0 if the user type is not recognized or has no aggregated levels.
   * @param userType The UserType to check.
   * @return levels Total aggregated levels for the specified user type.
   */
  function _totalLevels(CommunityTypes.UserType userType) private view returns (uint256) {
    if (userType == CommunityTypes.UserType.CONTRIBUTOR) {
      return contributorRules.totalActiveLevels();
    } else if (userType == CommunityTypes.UserType.DEVELOPER) {
      return developerRules.totalActiveLevels();
    } else if (userType == CommunityTypes.UserType.RESEARCHER) {
      return researcherRules.totalActiveLevels();
    } else {
      return 0;
    }
  }
}
