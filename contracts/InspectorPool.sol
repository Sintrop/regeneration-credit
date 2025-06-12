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
 * @title InspectorPool
 * @dev InspectorPool is a contract to reward inspectors
 * @notice Receive tokens for inspection service provided
 */
contract InspectorPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  /// @notice Interface to the Regeneration Credit token contract, used for token transfers.
  RegenerationCreditInterface internal regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this inspector pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 internal constant TOTAL_POOL_TOKENS = 180000000000000000000000000;

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
    regenerationCredit = RegenerationCreditInterface(regenerationCreditAddress);
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
    uint256 numTokens = calculateUserEraTokens(era, delegate, tokensPerEra(getEpochForEra(era), HALVING));

    // Update the user's era and token balance state after the withdrawal.
    updateEraAfterWithdraw(era, delegate, numTokens);

    // If no tokens are to be transferred, return.
    if (numTokens == 0) return;

    // Transfer the calculated tokens from this contract to the delegate.
    regenerationCredit.transferWith(address(this), delegate, numTokens);
  }

  /**
   * @dev Allows an authorized caller to increase the user pool level.
   * This function updates the inspector level within the system's pooling mechanism.
   * @notice Can only be called by the inspectorRules address.
   * @param addr The wallet address of the inspector.
   * @param levels The number of levels to increase the inspector's pool level by.
   */
  function addLevel(address addr, uint256 levels) public mustBeAllowedCaller {
    // Calls the addPoolLevel function from Poolable.sol.
    addPoolLevel(addr, levels, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to decrease an inspector's pool level.
   * This function adjusts the inspector's level downwards within the system's pooling mechanism.
   * @notice Can only be called by inspectorRules address.
   * @param addr The wallet address of the inspector.
   * @param levelsToRemove The number of levels to decrease the inspector's pool level by.
   */
  function removePoolLevels(address addr, uint256 levelsToRemove) public mustBeAllowedCaller {
    // Calls the removePoolLevel function from Poolable.sol.
    removePoolLevel(addr, currentContractEra(), levelsToRemove);
  }
}
