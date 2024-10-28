// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./PoolInterface.sol";
import { RegenerationCreditInterface } from "./RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./Blockable.sol";
import { Callable } from "./Callable.sol";
import { Poolable } from "./Poolable.sol";

/**
 * @author Sintrop
 * @title DeveloperPool
 * @dev Manage rewards to developers
 * @notice Receive tokens for development service provided
 */
contract DeveloperPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  uint256[8] private tokensPerEpochs = [
    144 * 10 ** 23,
    72 * 10 ** 23,
    36 * 10 ** 23,
    18 * 10 ** 23,
    9 * 10 ** 23,
    45 * 10 ** 22,
    225 * 10 ** 21,
    1125 * 10 ** 20
  ];

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _totalEras,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _totalEras, _halving) Poolable(tokensPerEpochs) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Returns how much tokens the contract has
   */
  function balance() public view returns (uint256) {
    return regenerationCredit.balanceOf(address(this));
  }

  function withdraw(
    address delegate,
    uint256 era
  ) public mustBeAllowedCaller canWithdrawModifier(era) isAValidEpochModifier {
    uint256 numTokens = tokens(era, delegate, tokensPerEra(currentEpoch(), HALVING));

    updateEraAfterWithdraw(era, delegate, numTokens);

    if (numTokens == 0) return;

    regenerationCredit.transferWith(address(this), delegate, numTokens);
  }

  function addLevel(address addr, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, currentLevel, addLevels, era);
  }

  function removePoolLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    removeLevelsFromEra(addr, era, removeSomeLevels);
  }
}
