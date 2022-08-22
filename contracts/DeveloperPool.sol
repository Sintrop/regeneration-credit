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
 * @author Everson B. Silva
 * @title DeveloperContract
 * @dev DeveloperPool is a contract to reward developers
 */
contract DeveloperPool is Ownable, Blockable, Callable, PoolInterface {
  using SafeMath for uint256;

  uint256 constant public FIXED_POINT = 10**18;
  uint256 constant public TOKENS_PER_ERA = 833333000000000000000000;
  uint256 constant public ERAS = 18;

  SacTokenInterface internal sacToken;

  mapping(uint256 => Era) public eras;

  constructor(
    address _sacTokenAddress,
    uint256 _blocksPerEra,
    uint256 _eraMax
  ) Blockable(_blocksPerEra, _eraMax) {
    sacToken = SacTokenInterface(_sacTokenAddress);
  }

  function approve(
    address delegate,
    uint256 level,
    uint256 currentEra
  ) public override mustBeAllowedCaller mustBeAbleToApprove(currentEra) {
    uint256 devTokens = tokens(level, currentEra);

    sacToken.approveWith(delegate, devTokens);
  }

  function tokens(uint256 level, uint256 currentEra)
    internal
    view
    returns (uint256)
  {
    uint256 levels = eras[currentEra].levels;
    if(levels == 0) return 0;

    return level.mul((TOKENS_PER_ERA.div(levels)));
  }

  function withDraw() public pure override returns (bool) {
    return true;
  }

  function allowance() public view override returns (uint256) {
    return sacToken.allowance(address(this), msg.sender);
  }

  function balanceOf(address tokenOwner) public view returns (uint256) {
    return sacToken.balanceOf(tokenOwner);
  }

  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  function addLevel(uint256 fromEra) public {
    upLevels(fromEra);
  }

  function removeLevel(uint256 fromEra, uint256 levels) public {
    downLevels(fromEra, levels);
  }

  function upLevels(uint256 fromEra) internal {
    for (uint256 i = fromEra; i <= ERAS; i++) {
      eras[i].levels++;
    }
  }

  function downLevels(uint256 fromEra, uint256 levels) internal {
    for (uint256 i = fromEra; i <= ERAS; i++) {
      eras[i].levels -= levels;
    }
  }

  modifier mustBeAbleToApprove(uint256 currentEra) {
    require(canApprove(currentEra), "You can't withdraw yet");
    _;
  }
}
