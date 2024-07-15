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
 * @title InspectorPool
 * @dev InspectorPool is a contract to reward inspectors
 */
contract InspectorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RcTokenInterface internal rcToken;

  uint256[8] private tokensPerEpochs = [
    864 * 10 ** 23,
    432 * 10 ** 23,
    216 * 10 ** 23,
    108 * 10 ** 23,
    54 * 10 ** 23,
    27 * 10 ** 23,
    135 * 10 ** 22,
    675 * 10 ** 21
  ];

  uint256 internal constant LIMIT_EPOCHS_SIZE = 8;

  constructor(
    address rcTokenAddress,
    uint256 _halving,
    uint256 _totalEras,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, tokensPerEpochs, _totalEras, _halving) {
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

    uint256 numTokens = tokens(era, delegate, tokensPerEra());

    if (numTokens == 0) return;

    eras[era].users++;
    eras[era].tokens += numTokens;
    eraTokens[era][delegate] = numTokens;

    rcToken.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address addr, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, currentLevel, addLevels, era);
  }

  function resetLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    resetLevelsFromEra(addr, era, removeSomeLevels);
  }
}
