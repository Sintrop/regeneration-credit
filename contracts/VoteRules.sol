// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { Activist } from "./types/ActivistTypes.sol";
import { Contributor } from "./types/ContributorTypes.sol";
import { Developer } from "./types/DeveloperTypes.sol";
import { Researcher } from "./types/ResearcherTypes.sol";

/**
 * @title VoteRules
 * @author Sintrop
 * @notice Defines the rules and logic for determining if a user is eligible to vote within the community.
 * @dev This contract calculates voting eligibility based on a user's levels relative to their user type's average levels.
 */
contract VoteRules {
  using SafeMath for uint256;

  // --- State Variables ---

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice ActivistRules contract address
  ActivistRules internal activistRules;

  /// @notice ContributorRules contract address
  ContributorRules internal contributorRules;

  /// @notice DeveloperRules contract address
  DeveloperRules internal developerRules;

  /// @notice ResearcherRules contract address
  ResearcherRules internal researcherRules;

  // --- Constructor ---

  /**
   * @dev Initializes the contract with the addresses of the various rule contracts.
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param activistRulesAddress Address of the ActivistRules contract.
   * @param contributorRulesAddress Address of the ContributorRules contract.
   * @param developerRulesAddress Address of the DeveloperRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract.
   */
  constructor(
    address communityRulesAddress,
    address activistRulesAddress,
    address contributorRulesAddress,
    address developerRulesAddress,
    address researcherRulesAddress
  ) {
    communityRules = CommunityRules(communityRulesAddress);
    activistRules = ActivistRules(activistRulesAddress);
    contributorRules = ContributorRules(contributorRulesAddress);
    developerRules = DeveloperRules(developerRulesAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
  }

  // --- Core Logic Functions ---

  /**
   * @notice Checks if a given address is eligible to send a vote based on predefined rules.
   * @dev This function calculates a user's eligibility by comparing their levels to the average levels of their user type.
   * It also requires the user to be designated as a 'voter' in CommunityRules.
   * @param addr The address of the user to check.
   * @return bool True if the user can vote, false otherwise.
   */
  function canVote(address addr) public view returns (bool) {
    require(communityRules.isVoter(addr), "Not a voter user");

    UserType userType = communityRules.getUser(addr);
    uint256 totalUsers = communityRules.userTypesTotalCount(userType);

    return canVoteRules(totalLevels(userType), totalUsers, totalUserLevels(addr, userType));
  }

  // --- Helper Functions (Internal/Pure/View) ---

  /**
   * @notice Determines voting eligibility based on user levels relative to type average.
   * @dev Calculates if a user's levels meet or exceed the average levels of their user type.
   * For user types with 5 or fewer total users, all are considered eligible.
   * @param totalTypeLevels Total levels for the specific user type across the system.
   * @param totalUsers Total number of users of the specific type registered in the system.
   * @param userLevels Total levels of the individual user.
   * @return bool True if the user meets the voting criteria, false otherwise.
   */
  function canVoteRules(uint256 totalTypeLevels, uint256 totalUsers, uint256 userLevels) internal pure returns (bool) {
    if (totalUsers <= 5) return true;

    uint256 avg = totalTypeLevels.div(totalUsers).add(1);

    return userLevels >= avg;
  }

  /**
   * @notice Calculates the total pool levels for a specific user.
   * @dev Retrieves the 'level' from the 'pool' struct associated with the given user's address and user type.
   * Returns 0 if the user type is not recognized or has no associated levels.
   * @param addr The address of the user to check.
   * @param userType The UserType of the user.
   * @return levels Total levels for the given address.
   */
  function totalUserLevels(address addr, UserType userType) internal view returns (uint256) {
    if (userType == UserType.ACTIVIST) {
      Activist memory user = activistRules.getActivist(addr);

      return user.pool.level;
    } else if (userType == UserType.CONTRIBUTOR) {
      Contributor memory user = contributorRules.getContributor(addr);

      return user.pool.level;
    } else if (userType == UserType.DEVELOPER) {
      Developer memory user = developerRules.getDeveloper(addr);

      return user.pool.level;
    } else if (userType == UserType.RESEARCHER) {
      Researcher memory user = researcherRules.getResearcher(addr);

      return user.pool.level;
    } else {
      return 0;
    }
  }

  /**
   * @notice Calculates the total aggregated levels for a specific user type across the system.
   * @dev Sums up levels based on specific metrics for each UserType (e.g., approved invites for Activists).
   * Returns 0 if the user type is not recognized or has no aggregated levels.
   * @param userType The UserType to check.
   * @return levels Total aggregated levels for the specified user type.
   */
  function totalLevels(UserType userType) internal view returns (uint256) {
    if (userType == UserType.ACTIVIST) {
      return activistRules.approvedInvites();
    } else if (userType == UserType.CONTRIBUTOR) {
      return contributorRules.contributionsTotalCount();
    } else if (userType == UserType.DEVELOPER) {
      return developerRules.reportsTotalCount();
    } else if (userType == UserType.RESEARCHER) {
      return researcherRules.researchesTotalCount();
    } else {
      return 0;
    }
  }
}
