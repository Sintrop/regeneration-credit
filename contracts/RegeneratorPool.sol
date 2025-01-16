// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./interfaces/PoolInterface.sol";
import { RegenerationCreditInterface } from "./interfaces/RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BlockableRules } from "./BlockableRules.sol";
import { CallableRules } from "./CallableRules.sol";
import { PoolableRules } from "./PoolableRules.sol";

/**
 * @author Sintrop
 * @title RegeneratorPool
 * @dev RegeneratorPool is a contract to reward regenerators
 * @notice Receive tokens for Nature regeneration service provided
 */
contract RegeneratorPool is PoolableRules, Ownable, BlockableRules, CallableRules {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  uint256 internal constant TOTAL_TOKENS_POOL = 750000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) BlockableRules(_blocksPerEra, _halving) PoolableRules(TOTAL_TOKENS_POOL) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Called by the regenerator contract, this function calls the token contract to transfer the rewards
   * @param delegate User address
   * @param era User current era
   */
  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller canWithdrawModifier(era) {
    uint256 numTokens = tokens(era, delegate, tokensPerEra(currentUserEpoch(era), HALVING));

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

    removeLevelsFromEra(regenerator, era, levels);
  }

  /**
   * @dev Called by the regenerator contract, function to decrease regenerator pool level
   * @param addr Regenerator wallet
   * @param era Current pool era
   * @param removeSomeLevels Levels to decrease
   */
  function removePoolLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    removeLevelsFromEra(addr, era, removeSomeLevels);
  }
}
