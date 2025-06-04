// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { RegenerationCreditInterface } from "./interfaces/RegenerationCreditInterface.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @author Sintrop
 * @title ContributorPool
 * @dev Manage rewards to contributors
 * @notice Receive tokens for generic service provided
 */
contract ContributorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  RegenerationCreditInterface internal regenerationCredit;

  /// @notice Total contributor pool tokens
  uint256 internal constant TOTAL_POOL_TOKENS = 40000000000000000000000000;

  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_POOL_TOKENS) {
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
  }

  /**
   * @dev Called by the contributor contract, this function calls the token contract to transfer the rewards
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
   * @dev Called by the contributor contract, function to increase contributor pool level
   * @param addr Contributor wallet
   * @param levels Contributor add level
   */
  function addLevel(address addr, uint256 levels) public mustBeAllowedCaller {
    addPoolLevel(addr, levels, currentContractEra());
  }

  /**
   * @dev Called by the contributor contract, function to decrease contributor pool level
   * @param addr Contributor wallet
   * @param levelsToRemove Levels to decrease
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    removePoolLevel(addr, currentContractEra(), levelsToRemove);
  }
}
