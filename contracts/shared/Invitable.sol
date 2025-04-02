// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Invitable
 * @dev Contract to check if users can invite others
 */
contract Invitable {
  using SafeMath for uint256;

  /**
   * @dev Calculate if a user can send invite
   * @param totalLevels total levels on the system
   * @param totalUsers total of user of specific type registered in the system
   * @param userLevels total levels of the user
   */
  function canInvite(uint256 totalLevels, uint256 totalUsers, uint256 userLevels) public pure returns (bool) {
    if (totalUsers <= 5) return true;

    uint256 avg = totalLevels.div(totalUsers).add(1);

    return userLevels >= avg;
  }
}
