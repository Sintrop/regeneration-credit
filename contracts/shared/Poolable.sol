// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Era } from "contracts/types/PoolTypes.sol";

/**
 * @author Sintrop
 * @title Poolable
 * @dev Manage tokens distribution logic
 */
contract Poolable {
  using SafeMath for uint256;

  /// @dev Total pool tokens
  uint256 internal immutable TOTAL_TOKENS;

  /// @dev Era data: Total of approved users, total levels and amout of tokens of an ERA
  mapping(uint256 => Era) public eras;

  /// @dev The releationship between an ERA and levels
  mapping(uint256 => mapping(address => uint256)) public eraLevels;

  /// @dev The releationship between an ERA and tokens
  mapping(uint256 => mapping(address => uint256)) public eraTokens;

  constructor(uint256 _totalTokens) {
    TOTAL_TOKENS = _totalTokens;
  }

  /**
   * @dev Returns an ERA data
   * @return Era ERA number
   */
  function getEra(uint256 era) external view returns (Era memory) {
    return eras[era];
  }

  /**
   * @dev Update ERA data after a withdraw
   */
  function updateEraAfterWithdraw(uint256 era, address user, uint256 numTokens) internal {
    eras[era].users++;
    eras[era].tokens += numTokens;
    eraTokens[era][user] = numTokens;
  }

  /**
   * @dev Add pool level to an user
   */
  function addPoolLevel(address to, uint256 levels, uint256 era) internal {
    eras[era].levels = eras[era].levels.add(levels);
    eraLevels[era][to] += levels;
  }

  /**
   * @dev Remove pool levels of an era from an user
   */
  function removeLevelsFromEra(address to, uint256 era, uint256 removeSomeLevels) internal {
    uint256 currentLevels = eraLevels[era][to];

    if (currentLevels == 0) return;

    uint256 levels = removeSomeLevels > 0 ? removeSomeLevels : currentLevels;

    removePoolLevel(to, era, levels);
  }

  /**
   * @dev Update ERA data after a withdraw
   */
  function removePoolLevel(address to, uint256 era, uint256 levels) private {
    if (levels > eraLevels[era][to]) levels = eraLevels[era][to];

    eras[era].levels = eras[era].levels.sub(levels);
    eraLevels[era][to] = eraLevels[era][to].sub(levels);
  }

  /**
   * @dev Calculates the amount of tokens an user can withdraw
   */
  function tokens(uint256 era, address to, uint256 _tokensPerEra) internal view returns (uint256) {
    uint256 levels = eras[era].levels;
    uint256 levelTo = eraLevels[era][to];

    if (levelTo == 0) return 0;

    return levelTo.mul(_tokensPerEra).div(levels);
  }

  /**
   * @dev Returns the amount of tokens to be distributed to users in current era
   * @notice Tokens of actual ERA
   */
  function tokensPerEra(uint256 currentEpoch, uint256 halving) public view returns (uint256) {
    return tokensPerEpoch(currentEpoch).div(halving);
  }

  /**
   * @dev Returns the amount of tokens to be distributed to users in current epoch
   * @notice Tokens of actual Epoch
   */
  function tokensPerEpoch(uint256 currentEpoch) public view returns (uint256) {
    return TOTAL_TOKENS.div((2 ** currentEpoch));
  }
}
