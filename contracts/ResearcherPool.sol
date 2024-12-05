// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegenerationCreditInterface } from "./RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./Blockable.sol";
import { Callable } from "./Callable.sol";
import { Poolable } from "./Poolable.sol";

/**
 * @author Sintrop
 * @title ResearcherPool
 * @dev ResearcherPool is a contract to reward researchers
 * @notice Receive tokens for research service provided
 */
contract ResearcherPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  uint256 internal constant TOTAL_TOKENS_POOL = 30000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_TOKENS_POOL) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Called by the researcher contract, this function calls the token contract to transfer the rewards
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
   * @dev Called by the researcher contract, function to increase researcher level
   * @param addr Researcher wallet
   * @param currentLevel Researcher current level
   * @param addLevels Levels to increase
   */
  function addLevel(address addr, uint256 currentLevel, uint256 addLevels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, currentLevel, addLevels, era);
  }

  /**
   * @dev Called by the researcher contract, function to decrease researcher pool level
   * @param addr Inspector wallet
   * @param era Current pool era
   * @param removeSomeLevels Levels to decrease
   */
  function removePoolLevels(address addr, uint256 era, uint256 removeSomeLevels) public mustBeAllowedCaller {
    removeLevelsFromEra(addr, era, removeSomeLevels);
  }
}
