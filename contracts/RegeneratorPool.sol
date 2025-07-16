// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @title RegeneratorPool
 * @author Sintrop
 * @notice This contract manages the distribution of Regeneration Credit tokens as rewards to regenerators
 * for their ecosystem regeneration service provided.
 * The reward is distributed related to the RegenerationScore, the result of each inspection that ranges from [0, 64].
 * @dev Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
 * `Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control).
 */
contract RegeneratorPool is Poolable, Ownable, Blockable, Callable, ReentrancyGuard {
  // --- Constants & state variables ---

  /// @notice Interface to the Regeneration Credit token contract, used for token transfers.
  IRegenerationCredit private regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this regenerator pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 private constant TOTAL_POOL_TOKENS = 750000000e18;

  // --- Constructor ---

  /**
   * @dev Initializes the RegeneratorPool contract.
   * Sets up the Regeneration Credit token interface and initializes inherited base contracts.
   * @param regenerationCreditAddress The address of the RegenerationCredit token contract.
   * @param _halving The number of eras that constitute one halving cycle/epoch for reward adjustments.
   * Passed to the `Blockable` base contract.
   * @param _blocksPerEra The number of blocks that constitute a single era.
   * Passed to the `Blockable` base contract.
   */
  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_POOL_TOKENS) {
    regenerationCredit = IRegenerationCredit(regenerationCreditAddress);
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller, the Regenerator contract, to trigger a token withdrawal for a user.
   * This function calculates the eligible tokens for the user's era and transfers them.
   * @notice This function can only be called by the RegeneratorRules contract, whitelisted via the `Callable` contract's mechanisms.
   * The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.
   * @param delegate The address of the user (regenerator) for whom the withdrawal is being processed.
   * @param era The last recorded era of the `delegate` user, used for reward calculation and eligibility.
   */
  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller canWithdrawModifier(era) nonReentrant {
    require(era <= currentContractEra(), "Era in the future");

    // Calculate the number of tokens the user is eligible to receive for the given era.
    uint256 numTokens = _calculateUserEraTokens(era, delegate, tokensPerEra(getEpochForEra(era), halving));

    // Update the user's era and token balance state after the withdrawal.
    _updateEraAfterWithdraw(era, delegate, numTokens);

    // If no tokens are to be transferred, return.
    if (numTokens == 0) return;

    // Transfer the calculated tokens from this contract to the delegate.
    bool success = regenerationCredit.transfer(delegate, numTokens);
    require(success, "ERC20: transfer failed");

    regenerationCredit.poolTransfer(address(this), delegate, numTokens);
  }

  /**
   * @dev Allows an authorized caller to increase the user pool level.
   * This function updates the regenerator level within the system's pooling mechanism.
   * @notice Can only be called by the regeneratorRules address.
   * @param regenerator The wallet address of the regenerator.
   * @param levels The number of levels to increase the regenerator's pool level by.
   */
  function addLevel(address regenerator, uint256 levels) public mustBeAllowedCaller nonReentrant {
    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(regenerator, levels, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to decrease an regenerator's pool level.
   * This function adjusts the regenerator's level downwards within the system's pooling mechanism.
   * @notice Can only be called by regeneratorRules address.
   * @param addr The wallet address of the regenerator.
   * @param levelsToRemove The number of levels to decrease the regenerator's pool level by.
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller nonReentrant {
    // Calls the _removePoolLevel function from Poolable.sol.
    _removePoolLevel(addr, currentContractEra(), levelsToRemove);
  }

  // --- View functions ---

  /**
   * @notice View function to check if a user have tokens to withdraw at an era.
   * @param delegate User address.
   * @param era User current era.
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function haveTokensToWithdraw(address delegate, uint256 era) public view returns (bool) {
    return _haveTokensToWithdraw(delegate, era, tokensPerEra(getEpochForEra(era), halving));
  }
}
