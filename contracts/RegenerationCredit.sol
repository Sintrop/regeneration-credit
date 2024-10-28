// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title Regeneration Credit
 * @author Sintrop
 * @dev Create and manage the token
 * @notice Token backed by the regeneration impact of the community
 */
contract RegenerationCredit is ERC20, Ownable {
  string public constant NAME = "REGENERATION CREDIT";
  string public constant SYMBOL = "RC";
  uint8 public constant DECIMALS = 18;
  uint256 public constant FUND_ICO = 124500000 * (10 ** DECIMALS);

  mapping(address => uint256) internal balances;
  mapping(address => mapping(address => uint256)) internal allowed;
  mapping(address => uint256) public certificate;
  mapping(address => bool) internal contractsPools;

  uint256 internal totalSupply_;
  uint256 internal totalCertified_;
  uint256 internal totalLocked_;

  using SafeMath for uint256;

  constructor(uint256 total, address _icoAddr) ERC20(NAME, SYMBOL) {
    totalSupply_ = total;
    balances[msg.sender] = totalSupply_;
    transfer(_icoAddr, FUND_ICO);
  }

  function addContractPool(address _fundAddress, uint256 _numTokens) public onlyOwner returns (bool) {
    contractsPools[_fundAddress] = true;
    transfer(_fundAddress, _numTokens);
    totalLocked_ += _numTokens;

    return true;
  }

  function transferWith(
    address tokenOwner,
    address receiver,
    uint256 numTokens
  ) public mustBeContractPool mustHaveRegenerationCredits(tokenOwner, numTokens) returns (bool) {
    balances[tokenOwner] = balances[tokenOwner].sub(numTokens);
    balances[receiver] = balances[receiver].add(numTokens);
    emit Transfer(tokenOwner, receiver, numTokens);

    unchecked {
      if (contractsPools[tokenOwner]) totalLocked_ -= numTokens;
    }

    return true;
  }

  function contractPool(address contractFundsAddress) internal view returns (bool) {
    return contractsPools[contractFundsAddress];
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

  function approve(address delegate, uint256 numTokens) public override returns (bool) {
    allowed[msg.sender][delegate] = numTokens;
    emit Approval(msg.sender, delegate, numTokens);
    return true;
  }

  function allowance(address owner, address delegate) public view override returns (uint256) {
    return allowed[owner][delegate];
  }

  function transferFrom(address owner, address buyer, uint256 numTokens) public override returns (bool) {
    require(numTokens <= balances[owner], "Insufficient balance.");
    require(numTokens <= allowed[owner][msg.sender], "Insufficient allowance.");

    balances[owner] = balances[owner].sub(numTokens);
    allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
    balances[buyer] = balances[buyer].add(numTokens);
    emit Transfer(owner, buyer, numTokens);
    return true;
  }

  function burnTokens(uint256 amount) public {
    burnTokensInternal(msg.sender, amount);
  }

  function burnTokensWith(address tokenOwner, uint256 amount) public mustBeContractPool {
    burnTokensInternal(tokenOwner, amount);
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

  function totalLocked() public view returns (uint256) {
    return totalLocked_;
  }

  modifier mustBeContractPool() {
    require(contractPool(msg.sender), "Not a contract pool");
    _;
  }

  modifier mustHaveRegenerationCredits(address tokenOwner, uint256 numTokens) {
    require(numTokens <= balances[tokenOwner], "You don't have RCT Tokens");
    _;
  }
}
