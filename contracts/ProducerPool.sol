// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./PoolInterface.sol";
import { RcTokenInterface } from "./RcTokenInterface.sol";
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

  RcTokenInterface internal rcToken;

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

  uint256 internal constant LIMIT_EPOCHS_SIZE = 8;

  constructor(
    address rcTokenAddress,
    uint256 _halving,
    uint256 _totalEras,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _totalEras, _halving) Poolable(tokensPerEpochs) {
    rcToken = RcTokenInterface(rcTokenAddress);
  }

  /**
   * @dev Returns how much tokens the contract has
   */
  function balance() public view returns (uint256) {
    return rcToken.balanceOf(address(this));
  }

  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller {
    require(canApprove(era), "You can't approve yet");
    require(currentEpoch() <= LIMIT_EPOCHS_SIZE, "You can't approve anymore");

    uint256 numTokens = tokens(era, delegate, tokensPerEra(currentEpoch(), HALVING));

    if (numTokens == 0) return;

    rcToken.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address producer, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(producer, currentLevel, addLevels, era);
  }

  function removeLevel(address producer, uint256 levels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    removePoolLevel(producer, era, levels);
  }

  function resetLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    resetLevelsFromEra(addr, era, removeSomeLevels);
  }
}
