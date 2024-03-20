// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RcTokenPS is ERC20, Ownable {
  string public constant NAME = "REGENERATION CREDIT PRE-SALE1";
  string public constant SYMBOL = "RCPS1";
  uint8 public constant DECIMALS = 18;

  mapping(address => uint256) internal balances;
  mapping(address => uint256) public certificate;

  uint256 internal totalSupply_;
  uint256 internal totalCertified_;

  using SafeMath for uint256;

  mapping(address => bool) internal contractsPools;

  constructor(uint256 total) ERC20(NAME, SYMBOL) {
    totalSupply_ = total;
    balances[msg.sender] = totalSupply_;
  }

  function totalSupply() public view override returns (uint256) {
    return totalSupply_;
  }

  function name() public pure override returns (string memory) {
    return NAME;
  }

  function balanceOf(address tokenOwner) public view override returns (uint256) {
    return balances[tokenOwner];
  }

  function transfer(address receiver, uint256 numTokens) public override returns (bool) {
    require(numTokens <= balances[msg.sender], "Insufficient balance.");
    balances[msg.sender] = balances[msg.sender].sub(numTokens);
    balances[receiver] = balances[receiver].add(numTokens);
    emit Transfer(msg.sender, receiver, numTokens);
    return true;
  }

  function burnTokens(uint256 amount) public {
    burnTokensInternal(msg.sender, amount);
  }

  function burnTokensInternal(address tokenOwner, uint256 amount) internal {
    _burn(tokenOwner, amount);
    certificate[tokenOwner] += amount;
    totalCertified_ += amount;
  }

  function _burn(address account, uint256 amount) internal override {
    require(account != address(0), "Burn from the zero address");

    uint256 accountBalance = balances[account];
    require(accountBalance >= amount, "Burn amount exceeds balance");
    unchecked {
      balances[account] = accountBalance - amount;
    }
    totalSupply_ -= amount;

    emit Transfer(account, address(0), amount);
  }

  function totalCertified() public view returns (uint256) {
    return totalCertified_;
  }

  modifier mustHaveRcTokens(address tokenOwner, uint256 numTokens) {
    require(numTokens <= balances[tokenOwner], "You don't have RCPS1 Tokens");
    _;
  }
}
