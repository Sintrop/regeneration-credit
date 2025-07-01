// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @title InspectorPool
 * @author Sintrop
 * @notice This contract manages the distribution of Regeneration Credit tokens as rewards to inspectors
 * for their inspection services provided, for counting trees and biodiversity of the Regenerators regeneration area.
 * Each valid realized inspection is equivalent to one level in the pool.
 * @dev Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
 * `Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control).
 */
contract InspectorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  // --- Constants & state variables ---

  /// @notice Interface to the Regeneration Credit token contract, used for token transfers.
  IRegenerationCredit internal regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this inspector pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 internal constant TOTAL_POOL_TOKENS = 180000000000000000000000000;

  // --- Constructor ---

  /**
   * @dev Initializes the InspectorPool contract.
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

  // --- Public Functions ---

  /**
   * @dev Allows an authorized caller, the Inspector contract, to trigger a token withdrawal for a user.
   * This function calculates the eligible tokens for the user's era and transfers them.
   * @notice This function can only be called by the InspectorRules contract, whitelisted via the `Callable` contract's mechanisms.
   * The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.
   * @param delegate The address of the user (inspector) for whom the withdrawal is being processed.
   * @param era The last recorded era of the `delegate` user, used for reward calculation and eligibility.
   */
  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller canWithdrawModifier(era) {
    require(era <= currentContractEra(), "Era in the future");

    // Calculate the number of tokens the user is eligible to receive for the given era.
    uint256 numTokens = _calculateUserEraTokens(era, delegate, tokensPerEra(getEpochForEra(era), halving));

    // Update the user's era and token balance state after the withdrawal.
    _updateEraAfterWithdraw(era, delegate, numTokens);

    // If no tokens are to be transferred, return.
    if (numTokens == 0) return;

    // Transfer the calculated tokens from this contract to the delegate.
    regenerationCredit.transfer(delegate, numTokens);
    regenerationCredit.poolTransfer(address(this), delegate, numTokens);
  }

  /**
   * @notice View function to check if a user have tokens to withdraw at an era
   * @param delegate User address
   * @param era User current era
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function haveTokensToWithdraw(address delegate, uint256 era) public view returns (bool) {
    return _haveTokensToWithdraw(delegate, era, tokensPerEra(getEpochForEra(era), halving));
  }

  /**
   * @dev Allows an authorized caller to increase the user pool level.
   * This function updates the inspector level within the system's pooling mechanism.
   * @notice Can only be called by the inspectorRules address.
   * @param addr The wallet address of the inspector.
   * @param levels The number of levels to increase the inspector's pool level by.
   */
  function addLevel(address addr, uint256 levels) public mustBeAllowedCaller {
    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(addr, levels, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to decrease an inspector's pool level.
   * This function adjusts the inspector's level downwards within the system's pooling mechanism.
   * @notice Can only be called by inspectorRules address.
   * @param addr The wallet address of the inspector.
   * @param levelsToRemove The number of levels to decrease the inspector's pool level by.
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    // Calls the _removePoolLevel function from Poolable.sol.
    _removePoolLevel(addr, currentContractEra(), levelsToRemove);
  }
}
