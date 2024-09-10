// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./Callable.sol";
import { RegenerationCredit } from "./RegenerationCredit.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SupporterPool is Callable {
  using SafeMath for uint256;

  RegenerationCredit internal regenerationCredit;

  uint256 public constant INVITER_PERCENTAGE = 1;

  constructor(address regenerationCreditAddress) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
  }

  event PoolBurnTokensEvent(
    address indexed _tokenOwner,
    uint256 _amountSend,
    uint256 _amountBurned,
    address indexed _inviter,
    uint256 _inviterTotalTokens
  );

  function balanceOf(address addr) public view returns (uint256) {
    return regenerationCredit.balanceOf(addr);
  }

  function burnTokens(address tokenOwner, address inviter, uint256 amount, bool isInvited) public mustBeAllowedCaller {
    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    uint256 amountBurn = amount.sub(inviterTotalTokens);

    regenerationCredit.burnTokensWith(tokenOwner, amountBurn);

    emit PoolBurnTokensEvent(tokenOwner, amount, amountBurn, inviter, inviterTotalTokens);

    if (!isInvited) return;

    regenerationCredit.transferWith(tokenOwner, inviter, inviterTotalTokens);
  }
}
