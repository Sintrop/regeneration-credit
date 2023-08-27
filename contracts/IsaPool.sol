// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolPassiveInterface } from "./PoolPassiveInterface.sol";
import { RcTokenInterface } from "./RcTokenInterface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title IsaPool
 * @dev IsaPool is a contract to manage user votes
 */
contract IsaPool is PoolPassiveInterface, Ownable, Callable {
  RcTokenInterface internal rcToken;

  constructor(address rcTokenAddress) {
    rcToken = RcTokenInterface(rcTokenAddress);
  }

  /**
   * @dev Show how much tokens the developer can withdraw from DeveloperPool address
   * @return uint256
   * TODO Check external code call - EXTCALL
   */
  function allowance() public view override returns (uint256) {
    return rcToken.allowance(address(this), msg.sender);
  }

  /**
   * @dev Allow a user know how much RCT Tokens has
   * @param tokenOwner The address of the token owner
   * @return uint256
   */
  function balanceOf(address tokenOwner) public view override returns (uint256) {
    return rcToken.balanceOf(tokenOwner);
  }

  /**
   * @dev Allow a user know how much RCT Tokens this pool has
   */
  function balance() public view override returns (uint256) {
    return balanceOf(address(this));
  }

  /**
   * @dev Allow a user approve some tokens from pool to he
   * @param _numTokens How much tokens the user want transfer
   * @return bool
   */
  function approveWith(address delegate, uint256 _numTokens) public override mustBeAllowedCaller returns (bool) {
    rcToken.approveWith(delegate, _numTokens);
    return true;
  }

  function withDraw() public pure override returns (bool) {
    return true;
  }

  /**
   * @dev Allow a user transfer some tokens to this contract pool
   * @param tokenOwner The address of the token owner
   * @param numTokens How much tokens the user want transfer
   * @return bool
   */
  function transferWith(
    address tokenOwner,
    address receiver,
    uint256 numTokens
  ) public override mustBeAllowedCaller returns (bool) {
    rcToken.transferWith(tokenOwner, receiver, numTokens);
    return true;
  }
}
