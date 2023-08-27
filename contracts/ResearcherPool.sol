// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./PoolInterface.sol";
import { SacTokenInterface } from "./RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./Blockable.sol";
import { Callable } from "./Callable.sol";
import { Poolable } from "./Poolable.sol";

/**
 * @author Sintrop
 * @title ResearcherPool
 * @dev ResearcherPool is a contract to reward researchers
 */
contract ResearcherPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  uint256 internal immutable halving;
  uint256 internal immutable totalEras;

  SacTokenInterface internal sacToken;

  uint256[8] internal tokensPerEpochs = [
    14400000000000000000000000,
    7200000000000000000000000,
    3600000000000000000000000,
    1800000000000000000000000,
    900000000000000000000000,
    450000000000000000000000,
    225000000000000000000000,
    112500000000000000000000
  ];

  uint256 internal constant LIMIT_EPOCHS_SIZE = 8;

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

  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  function balanceOf(address addr) public view returns (uint256) {
    return sacToken.balanceOf(addr);
  }

  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller {
    require(canApprove(era), "You can't approve yet");
    require(currentEpoch() <= LIMIT_EPOCHS_SIZE, "You can't approve anymore");

    uint256 numTokens = tokens(era, delegate, tokensPerEra());

    if (numTokens == 0) return;

    eras[era].users++;
    eras[era].tokens += numTokens;
    eraTokens[era][delegate] = numTokens;

    sacToken.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address addr, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, currentLevel, addLevels, era);
  }

  function removeLevel(address addr) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    removePoolLevel(addr, era);
  }

  function resetLevels(address addr, uint256 era) public mustBeAllowedCaller {
    resetUserPoolCurrentEra(addr, era);
  }

  function tokensPerEra() public view returns (uint256) {
    return tokensPerEpoch().div(halving);
  }

  function tokensPerEpoch() public view returns (uint256) {
    return tokensPerEpochs[currentEpoch().sub(1)];
  }

  function currentEpoch() public view returns (uint256) {
    return currentContractEra().div(halving).add(1);
  }
}
