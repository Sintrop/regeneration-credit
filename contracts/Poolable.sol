// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Poolable {
  using SafeMath for uint256;

  struct Era {
    uint256 users;
    uint256 tokens;
    uint256 levels;
  }

  mapping(uint256 => Era) public eras;
  mapping(uint256 => mapping(address => uint256)) public eraLevels;
  mapping(uint256 => mapping(address => uint256)) public eraTokens;

  function getEra(uint256 era) external view returns (Era memory) {
    return eras[era];
  }

  function addPoolLevel(address to, uint256 levelsNewEra, uint256 addLevel, uint256 era) internal {
    uint256 levels = eraLevels[era][to] > 0 ? addLevel : levelsNewEra;

    eras[era].levels = eras[era].levels.add(levels);
    eraLevels[era][to] += levels;
  }

  function resetLevelsFromEra(address to, uint256 era, uint256 removeSomeLevels) internal {
    uint256 currentLevels = eraLevels[era][to];

    if (currentLevels == 0) return;

    uint256 levels = removeSomeLevels > 0 ? removeSomeLevels : currentLevels;

    removePoolLevel(to, era, levels);
  }

  function removePoolLevel(address to, uint256 era, uint256 levels) internal {
    if (levels > eraLevels[era][to]) levels = eraLevels[era][to];

    eras[era].levels = eras[era].levels.sub(levels);
    eraLevels[era][to] = eraLevels[era][to].sub(levels);
  }

  function tokens(uint256 era, address to, uint256 tokensPerEra) internal view returns (uint256) {
    uint256 levels = eras[era].levels;
    uint256 levelTo = eraLevels[era][to];

    if (levelTo == 0) return 0;

    return levelTo.mul(tokensPerEra).div(levels);
  }
}
