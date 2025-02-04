// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Invitable {
  using SafeMath for uint256;

  /**
   * @dev Calculate if a user can send invite
   * @param totalUserTypes total of user of specific type registered in the system
   * @param totalLevels total levels on the system
   * @param userTotalLevels total levels tha a user have
   */
  function canInvite(uint256 totalLevels, uint256 userTotalLevels, uint256 totalUserTypes) public pure returns (bool) {
    uint256 avg = totalLevels.div(totalUserTypes).add(1);

    return userTotalLevels >= avg;
  }
}
