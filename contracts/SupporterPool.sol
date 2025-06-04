// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { Callable } from "./shared/Callable.sol";
import { RegenerationCredit } from "./RegenerationCredit.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title SupporterPool
 * @dev SupporterPool is a contract to reward supporters
 * @notice Receive tokens for inviting others to burn tokens
 */
contract SupporterPool is Callable {
  RegenerationCredit internal regenerationCredit;

  constructor(address regenerationCreditAddress) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
  }

  /**
   * @dev Burn tokens event
   */
  event PoolBurnTokensEvent(
    address indexed _tokenOwner,
    uint256 _amountBurned,
    address indexed _inviter,
    uint256 _inviterTotalTokens
  );

  /**
   * @dev Checks the regeneration credit balance of an address
   */
  function balanceOf(address addr) public view returns (uint256) {
    return regenerationCredit.balanceOf(addr);
  }

  /**
   * @dev Called by supporterRules, burn tokens function that pays reward for inviter
   */
  function burnTokens(
    address tokenOwner,
    address inviter,
    uint256 amountBurn,
    uint256 inviterTotalTokens
  ) public mustBeAllowedCaller {
    regenerationCredit.burnTokensWith(tokenOwner, amountBurn);

    emit PoolBurnTokensEvent(tokenOwner, amountBurn, inviter, inviterTotalTokens);

    if (inviterTotalTokens <= 0) return;

    regenerationCredit.transferWith(tokenOwner, inviter, inviterTotalTokens);
  }
}
