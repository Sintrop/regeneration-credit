// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Callable } from "./Callable.sol";
import { RcToken } from "./RcToken.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SupporterPool is Callable {
  RcToken internal rcToken;

  uint256 public constant INVITER_PERCENTAGE = 1;

  using SafeMath for uint256;

  constructor(address rcTokenAddress) {
    rcToken = RcToken(rcTokenAddress);
  }

  event BurnTokens(address indexed _tokenOwner, uint256 _amount);
  event InviterTokens(address indexed _tokenOwner, address indexed _inviter, uint256 _inviterTotalTokens);

  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  function balanceOf(address addr) public view returns (uint256) {
    return rcToken.balanceOf(addr);
  }

  function burnTokens(address tokenOwner, address inviter, uint256 amount, bool isInvited) public mustBeAllowedCaller {
    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    amount = amount.sub(inviterTotalTokens);

    rcToken.burnTokensWith(tokenOwner, amount);
    emit BurnTokens(tokenOwner, amount);

    if (!isInvited || inviterTotalTokens == 0) return;

    rcToken.transferWith(tokenOwner, inviter, inviterTotalTokens);
    emit InviterTokens(tokenOwner, inviter, inviterTotalTokens);
  }
}
