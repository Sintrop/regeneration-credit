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
 * @title ContributorPool
 * @dev ContributorPool is a contract to reward contributors
 */
contract ContributorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RcTokenInterface internal rcToken;

  uint256[8] private tokensPerEpochs = [
    36 * 10 ** 23,
    18 * 10 ** 23,
    9 * 10 ** 23,
    45 * 10 ** 22,
    225 * 10 ** 21,
    1125 * 10 ** 20,
    28125 * 10 ** 18,
    703125 * 10 ** 16
  ];

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

  function withdraw(
    address delegate,
    uint256 era
  ) public mustBeAllowedCaller canWithdrawModifier(era) isAValidEpochModifier {
    uint256 numTokens = tokens(era, delegate, tokensPerEra(currentEpoch(), HALVING));

    updateEraAfterWithdraw(era, delegate, numTokens);

    if (numTokens == 0) return;

    rcToken.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address addr, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, currentLevel, addLevels, era);
  }

  function removePoolLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    removeLevelsFromEra(addr, era, removeSomeLevels);
  }
}
