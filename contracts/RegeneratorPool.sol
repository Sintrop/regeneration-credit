// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegenerationCreditInterface } from "./interfaces/RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @author Sintrop
 * @title RegeneratorPool
 * @dev RegeneratorPool is a contract to reward regenerators
 * @notice Receive tokens for Nature regeneration service provided
 */
contract RegeneratorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  /// @notice Total regenerator pool tokens
  uint256 internal constant TOTAL_POOL_TOKENS = 750000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_POOL_TOKENS) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Called by the regenerator contract, this function calls the token contract to transfer the rewards
   * @param delegate User address
   * @param era User current era
   */
  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller canWithdrawModifier(era) {
    uint256 numTokens = calculateUserEraTokens(era, delegate, tokensPerEra(currentUserEpoch(era), HALVING));

    updateEraAfterWithdraw(era, delegate, numTokens);

    if (numTokens == 0) return;

    regenerationCredit.transferWith(address(this), delegate, numTokens);
  }

  /**
   * @dev Called by the regenerator contract, function to increase regenerator level
   * @param regenerator Regenerator wallet
   * @param levels Levels to increase
   */
  function addLevel(address regenerator, uint256 levels) public mustBeAllowedCaller {
    addPoolLevel(regenerator, levels, currentContractEra());
  }

  /**
   * @dev Called by the regenerator contract, function to decrease regenerator regeneration level
   * @param regenerator Regenerator wallet
   * @param levels Levels to decrease
   */
  function removeLevel(address regenerator, uint256 levels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    removePoolLevel(regenerator, era, levels);
  }

  /**
   * @dev Called by the regenerator contract, function to decrease regenerator pool level
   * @param addr Regenerator wallet
   * @param levelsToRemove Levels to decrease
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    removePoolLevel(addr, currentContractEra(), levelsToRemove);
  }
}
