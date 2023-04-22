// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./PoolInterface.sol";
import { SacTokenInterface } from "./SacTokenInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./Blockable.sol";
import { Callable } from "./Callable.sol";
import { Poolable } from "./Poolable.sol";

/**
 * @author Sintrop
 * @title ProducerPool
 * @dev ProducerPool is a contract to reward producers
 */
contract ProducerPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  uint256 internal immutable halving;
  uint256 internal immutable totalEras;

  SacTokenInterface internal sacToken;

  uint256[8] internal tokensPerEpochs = [
    360000000000000000000000000,
    180000000000000000000000000,
    90000000000000000000000000,
    45000000000000000000000000,
    22500000000000000000000000,
    11250000000000000000000000,
    5625000000000000000000000,
    2812500000000000000000000
  ];

  constructor(
    address sacTokenAddress,
    uint256 _halving,
    uint256 _totalEras,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _totalEras) {
    sacToken = SacTokenInterface(sacTokenAddress);
    halving = _halving;
    totalEras = _totalEras;
  }

  /**
   * @dev Returns how much tokens the contract has
   */
  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  /**
   * @dev Returns how much tokensa user has
   * @param addr The address of the developer
   */
  function balanceOf(address addr) public view returns (uint256) {
    return sacToken.balanceOf(addr);
  }

  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller {
    require(canApprove(era), "You can't approve yet");
    uint256 numTokens = tokens(era, delegate, tokensPerEra());

    if (numTokens == 0) return;

    sacToken.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address producer, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(producer, currentLevel, addLevels, era);
  }

  function removeLevel(address producer) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    removePoolLevel(producer, era);
  }

  function tokensPerEra() public view returns (uint256) {
    return tokensPerEpoch().div(totalEras);
  }

  function tokensPerEpoch() public view returns (uint256) {
    return tokensPerEpochs[currentEpoch().sub(1)];
  }

  function currentEpoch() public view returns (uint256) {
    return currentContractEra().div(halving).add(1);
  }
}
