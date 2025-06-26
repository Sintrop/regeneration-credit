// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { Callable } from "./shared/Callable.sol";
import { RegenerationCredit } from "./RegenerationCredit.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SupporterPool
 * @author Sintrop
 * @notice Contrat that manages token referral commission for supporters.
 * Supporters can receive tokens for inviting others when they burn their tokens.
 * @dev SupporterPool is a contract designed to manage the token burning rewards of the RegenerationCredit.
 */
contract SupporterPool is Callable {
  /// @notice The address of the RegenerationCredit token contract.
  RegenerationCredit internal regenerationCredit;

  // --- Constructor ---

  /**
   * @notice Initializes the SupporterPool contract.
   * @dev Sets the address of the RegenerationCredit token contract.
   * @param regenerationCreditAddress The address of the RegenerationCredit token contract.
   */
  constructor(address regenerationCreditAddress) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
  }

  // --- External/Public Functions ---

  /**
   * @notice Burns tokens from a user and potentially rewards an inviter.
   * @dev This function is intended to be called by an allowed caller (e.g., SupporterRules).
   * It burns a specified amount of `RegenerationCredit` tokens from `tokenOwner` and
   * transfers a commission to the `inviter` if `inviterCommision` is greater than 0.
   * Assumes `tokenOwner` has approved this contract to spend `amountBurn + inviterCommision`.
   * @param tokenOwner The address of the user whose tokens are to be burned.
   * @param inviter The address of the inviter to receive commission. Can be address(0) if no inviter.
   * @param amountBurn The amount of tokens to burn from the `tokenOwner`.
   * @param inviterCommision The amount of tokens to transfer to the `inviter`.
   */
  function burnTokens(
    address tokenOwner,
    address inviter,
    uint256 amountBurn,
    uint256 inviterCommision
  ) public mustBeAllowedCaller {
    // Perform the token burning
    regenerationCredit.burnTokensWith(tokenOwner, amountBurn);

    // Commision transfer
    if (inviterCommision > 0) {
      regenerationCredit.transferWith(tokenOwner, inviter, inviterCommision);
    }

    emit PoolBurnTokensEvent(tokenOwner, amountBurn, inviter, inviterCommision);
  }

  // --- Events ---

  /**
   * @notice Emitted when tokens are burned through the SupporterPool.
   * @param _tokenOwner The address of the user whose tokens were burned.
   * @param _amountBurned The net amount of tokens burned by the tokenOwner (excluding inviter commission).
   * @param _inviter The address of the inviter who receives a commission, or address(0) if no inviter.
   * @param _inviterTotalTokens The amount of tokens transferred to the inviter as commission.
   */
  event PoolBurnTokensEvent(
    address indexed _tokenOwner,
    uint256 _amountBurned,
    address indexed _inviter,
    uint256 _inviterTotalTokens
  );
}
