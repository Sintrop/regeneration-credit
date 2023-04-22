// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

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

  function addPoolLevel(address to, uint256 currentLevel, uint256 addLevel, uint256 era) internal {
    uint256 levels = eraLevels[era][to] > 0 ? addLevel : currentLevel;

    eras[era].levels = eras[era].levels.add(levels);
    eraLevels[era][to] += levels;
  }

  function removePoolLevel(address to, uint256 era) internal {
    require(eraLevels[era][to] != 0, "Not enough levels to remove");

    eras[era].levels = eras[era].levels.sub(1);
    eraLevels[era][to]--;
  }

  function tokens(uint256 era, address to, uint256 tokensPerEra) internal view returns (uint256) {
    uint256 levels = eras[era].levels;
    uint256 levelTo = eraLevels[era][to];

    if (levelTo == 0) return 0;

    return levelTo.mul((tokensPerEra.div(levels)));
  }
}
