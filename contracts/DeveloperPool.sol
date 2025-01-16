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
 * @title DeveloperPool
 * @dev Manage rewards to developers
 * @notice Receive tokens for development service provided
 */
contract DeveloperPool is PoolableRules, Ownable, BlockableRules, CallableRules {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;
  uint256 internal constant TOTAL_TOKENS_POOL = 30000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) BlockableRules(_blocksPerEra, _halving) PoolableRules(TOTAL_TOKENS_POOL) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Called by the developer contract, this function calls the token contract to transfer the rewards
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
   * @dev Called by the developer contract, function to increase developer pool level
   * @param addr Developer wallet
   * @param levels Levels to increase
   */
  function addLevel(address addr, uint256 levels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, levels, era);
  }

  /**
   * @dev Called by the developer contract, function to decrease developer pool level
   * @param addr Developer wallet
   * @param era Current pool era
   * @param removeSomeLevels Levels to decrease
   */
  function removePoolLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    removeLevelsFromEra(addr, era, removeSomeLevels);
  }
}
