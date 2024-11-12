// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Poolable
 * @dev Manage tokens distribution logic
 */
contract Poolable {
  using SafeMath for uint256;

  uint256 private constant EPOCH_MAX = 8;
  uint256[EPOCH_MAX] private tokensPerEpochs;

  struct Era {
    uint256 users;
    uint256 tokens;
    uint256 levels;
  }

  mapping(uint256 => Era) public eras;
  mapping(uint256 => mapping(address => uint256)) public eraLevels;
  mapping(uint256 => mapping(address => uint256)) public eraTokens;

  constructor(uint256[8] memory _tokensPerEpochs) {
    tokensPerEpochs = _tokensPerEpochs;
  }

  function getEra(uint256 era) external view returns (Era memory) {
    return eras[era];
  }

  function updateEraAfterWithdraw(uint256 era, address user, uint256 numTokens) internal {
    eras[era].users++;
    eras[era].tokens += numTokens;
    eraTokens[era][user] = numTokens;
  }

  function addPoolLevel(address to, uint256 levelsNewEra, uint256 addLevel, uint256 era) internal {
    uint256 levels = eraLevels[era][to] > 0 ? addLevel : levelsNewEra;

    eras[era].levels = eras[era].levels.add(levels);
    eraLevels[era][to] += levels;
  }

  function removeLevelsFromEra(address to, uint256 era, uint256 removeSomeLevels) internal {
    uint256 currentLevels = eraLevels[era][to];

    if (currentLevels == 0) return;

    uint256 levels = removeSomeLevels > 0 ? removeSomeLevels : currentLevels;

    removePoolLevel(to, era, levels);
  }

  function removePoolLevel(address to, uint256 era, uint256 levels) private {
    if (levels > eraLevels[era][to]) levels = eraLevels[era][to];

    eras[era].levels = eras[era].levels.sub(levels);
    eraLevels[era][to] = eraLevels[era][to].sub(levels);
  }

  function tokens(uint256 era, address to, uint256 _tokensPerEra) internal view returns (uint256) {
    uint256 levels = eras[era].levels;
    uint256 levelTo = eraLevels[era][to];

    if (levelTo == 0) return 0;

    return levelTo.mul(_tokensPerEra).div(levels);
  }

  function tokensPerEra(uint256 currentEpoch, uint256 halving) public view returns (uint256) {
    return tokensPerEpoch(currentEpoch).div(halving);
  }

  function tokensPerEpoch(uint256 currentEpoch) public view returns (uint256) {
    if (currentEpoch > EPOCH_MAX) return 0;

    return tokensPerEpochs[currentEpoch.sub(1)];
  }
}
