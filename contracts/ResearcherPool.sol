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
 * @title ResearcherPool
 * @dev ResearcherPool is a contract to reward researchers
 * @notice Receive tokens for research service provided
 */
contract ResearcherPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  /// @notice Total researcher pool tokens
  uint256 internal constant TOTAL_POOL_TOKENS = 40000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_POOL_TOKENS) {
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
   * @notice View function to check if a user have tokens to withdraw at an era
   * @param delegate User address
   * @param era User current era
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function haveTokensToWithdraw(address delegate, uint256 era) public view returns (bool) {
    uint256 numTokens = tokens(era, delegate, tokensPerEra(currentUserEpoch(era), HALVING));

    return numTokens > 0;
  }

  /**
   * @dev Called by the researcher contract, function to increase researcher level
   * @param addr Researcher wallet
   * @param levels Levels to increase
   */
  function addLevel(address addr, uint256 levels) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(addr, levels, era);
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
