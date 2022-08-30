// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SacTokenInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./types/DeveloperPoolTypes.sol";
import "./Blockable.sol";
import "./Callable.sol";

/**
 * @author Sintrop
 * @title DeveloperContract
 * @dev DeveloperPool is a contract to reward developers
 */
contract DeveloperPool is Ownable, Blockable, Callable, PoolInterface {
  using SafeMath for uint256;

  uint256 public constant FIXED_POINT = 10**18;
  uint256 public constant TOKENS_PER_ERA = 833333000000000000000000;
  uint256 public constant ERAS = 18;

  SacTokenInterface internal sacToken;

  mapping(uint256 => Era) public eras;

  constructor(
    address sacTokenAddress,
    uint256 blocksPerEra,
    uint256 eraMax
  ) Blockable(blocksPerEra, eraMax) {
    sacToken = SacTokenInterface(sacTokenAddress);
  }

  /**
   * @dev Returns a era
   * @param era The number of the era
   */
  function getEra(uint256 era) public view returns (Era memory) {
    return eras[era];
  }

  /**
   * @dev Allow developers to claim their tokens
   * @param delegate The address of the delegate developer
   * @param level The level the developer is at
   * @param currentEra The currentEra of the developer
   */
  function approve(
    address delegate,
    uint256 level,
    uint256 currentEra
  ) public override mustBeAllowedCaller {
    require(canApprove(currentEra), "You can't approve yet");

    uint256 devTokens = tokens(level, currentEra);

    sacToken.approveWith(delegate, devTokens);
  }

  //TODO: Implement withdraw method (pool and sacToken)
  function withDraw() public pure override returns (bool) {
    return true;
  }

  /**
   * @dev Returns the amount of tokens a developer can claim
   */
  function allowance() public view override returns (uint256) {
    return sacToken.allowance(address(this), msg.sender);
  }

  /**
   * @dev Returns how much tokens the developer has
   * @param tokenOwner The address of the developer
   */
  function balanceOf(address tokenOwner) public view returns (uint256) {
    return sacToken.balanceOf(tokenOwner);
  }

  /**
   * @dev Returns how much tokens the contract has
   */
  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  /**
   * @dev Allow add new level to eras
   * @param fromEra The era to start adding levels
   */
  function addLevel(uint256 fromEra) public mustBeAllowedCaller {
    upLevels(fromEra);
  }

  /**
   * @dev Allow remove levels from eras
   * @param fromEra The era to start removing levels
   * @param levels The amount of levels to remove
   */
  function removeLevel(uint256 fromEra, uint256 levels) public mustBeAllowedCaller {
    downLevels(fromEra, levels);
  }

  /**
   * @dev Calc the amount of tokens a developer can claim
   * @param level The level of the developer
   * @param currentEra The current era of the developer
   */
  function tokens(uint256 level, uint256 currentEra) internal view returns (uint256) {
    uint256 levels = eras[currentEra].levels;
    if (levels == 0) return 0;

    return level.mul((TOKENS_PER_ERA.div(levels)));
  }

  /**
   * @dev Increase the amount of levels in eras
   * @param fromEra The era to start adding levels
   */
  function upLevels(uint256 fromEra) internal {
    for (uint256 i = fromEra; i <= ERAS; i++) {
      eras[i].levels++;
    }
  }

  /**
   * @dev Decrease the amount of levels in eras
   * @param fromEra The era to start removing levels
   */
  function downLevels(uint256 fromEra, uint256 levels) internal {
    require(eras[fromEra].levels >= levels, "Not enough levels to remove");

    for (uint256 i = fromEra; i <= ERAS; i++) {
      eras[i].levels -= levels;
    }
  }
}
