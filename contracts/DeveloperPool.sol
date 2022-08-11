// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SacTokenInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./types/DeveloperPoolTypes.sol";
import "./Blockable.sol";

/**
 * @author Everson B. Silva
 * @title DeveloperContract
 * @dev DeveloperPool is a contract to reward developers
 */
contract DeveloperPool is Ownable, Blockable {
  using SafeMath for uint256;

  mapping(uint256 => Era) public eras;

  uint256[18] public levelsSumPerEra;
  uint256 public tokensPerEra;

  SacTokenInterface internal sacToken;

  constructor(
    address _sacTokenAddress,
    uint256 _tokensPerEra,
    uint256 _blocksPerEra,
    uint256 _eraMax
  ) Blockable(_blocksPerEra, _eraMax) {
    sacToken = SacTokenInterface(_sacTokenAddress);
    tokensPerEra = _tokensPerEra.mul(10**18);
  }

  /**
   * @dev Add metrics actions to eras. The metrics are numbers of tokens and developers.
   * @param _era The current era that the develop approve() tokens
   * @param _tokens How much tokens the win to this era
   */
  function setEraMetrics(uint256 _era, uint256 _tokens) internal {
    uint256 oneDev = 1;
    Era memory newEra = Era(
      _era,
      _tokens.add(eras[_era].tokens),
      oneDev.add(eras[_era].developers)
    );
    eras[_era] = newEra;
  }

  /**
   * @dev Calc how much tokens the dev can approve in some era
   * @param _level The level of the developer
   * @param _era Era to calc in
   */
  function calcTokens(uint256 _level, uint256 _era) internal view returns (uint256) {
    uint256 _levelsSum = levelsSumPerEra[_era - 1];
    if (_levelsSum == 0) return 0;
    return _level.mul((tokensPerEra.div(_levelsSum)));
  }
}
