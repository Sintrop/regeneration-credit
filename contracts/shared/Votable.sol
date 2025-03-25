// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { CommunityRules } from "../CommunityRules.sol";
import { ActivistRules } from "../ActivistRules.sol";
import { ContributorRules } from "../ContributorRules.sol";
import { DeveloperRules } from "../DeveloperRules.sol";
import { ResearcherRules } from "../ResearcherRules.sol";
import { UserType } from "../types/CommunityTypes.sol";
import { Activist } from "../types/ActivistTypes.sol";
import { Contributor } from "../types/ContributorTypes.sol";
import { Developer } from "../types/DeveloperTypes.sol";
import { Researcher } from "../types/ResearcherTypes.sol";

contract Votable {
  using SafeMath for uint256;

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

  /**
   * @dev Calculate if a user can send vote
   * @param addr The user address
   */
  function canVote(address addr) public view returns (bool) {
    require(communityRules.isVoter(msg.sender), "Not a voter user");

    UserType userType = communityRules.getUser(addr);
    uint256 totalUsers = communityRules.userTypesTotalCount(userType);

    return canVote(totalLevels(userType), totalUsers, totalUserLevels(addr, userType));
  }

  function totalUserLevels(address addr, UserType userType) public view returns (uint256) {
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

  function totalLevels(UserType userType) public view returns (uint256) {
    if (userType == UserType.ACTIVIST) {
      return activistRules.approvedInvites();
    } else if (userType == UserType.CONTRIBUTOR) {
      return contributorRules.contributionsCount();
    } else if (userType == UserType.DEVELOPER) {
      return developerRules.reportsTotalCount();
    } else if (userType == UserType.RESEARCHER) {
      return researcherRules.researchesTotalCount();
    } else {
      return 0;
    }
  }

  /**
   * @dev Calculate if a user can send vote
   * @param totalLevels total levels on the system
   * @param totalUsers total of user of specific type registered in the system
   * @param userLevels total levels of the user
   */
  function canVote(uint256 totalLevels, uint256 totalUsers, uint256 userLevels) public pure returns (bool) {
    uint256 avg = totalLevels.div(totalUsers).add(1);

    return userLevels >= avg.mul(15).div(10);
  }
}
