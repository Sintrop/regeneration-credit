// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SacToken is ERC20, Ownable {
  string public constant NAME = "SUSTAINABLE AGRICULTURE CREDIT";
  string public constant SYMBOL = "SAC";
  uint8 public constant DECIMALS = 18;

  mapping(address => uint256) internal balances;
  mapping(address => mapping(address => uint256)) internal allowed;
  mapping(address => uint256) public burned;

  uint256 internal totalSupply_;

  using SafeMath for uint256;

  mapping(address => bool) internal contractsPools;

  constructor(uint256 total) ERC20(NAME, SYMBOL) {
    totalSupply_ = total;
    balances[msg.sender] = totalSupply_;
  }

  function addContractPool(address _fundAddress, uint256 _numTokens)
    public
    onlyOwner
    returns (bool)
  {
    contractsPools[_fundAddress] = true;
    transfer(_fundAddress, _numTokens);
    return true;
  }

  function removeContractPool(address _fundAddress) public onlyOwner returns (bool) {
    contractsPools[_fundAddress] = false;
    return true;
  }

  function approveWith(address delegate, uint256 numTokens)
    public
    mustBeContractPool
    returns (uint256)
  {
    allowed[msg.sender][delegate] = numTokens + allowance(msg.sender, delegate);
    emit Approval(msg.sender, delegate, numTokens);
    return numTokens;
  }

  function transferWith(
    address tokenOwner,
    address receiver,
    uint256 numTokens
  ) public mustBeContractPool mustHaveSacTokens(tokenOwner, numTokens) returns (bool) {
    balances[tokenOwner] = balances[tokenOwner].sub(numTokens);
    balances[receiver] = balances[receiver].add(numTokens);
    emit Transfer(tokenOwner, receiver, numTokens);

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

  function allowance(address owner, address delegate)
    public
    view
    override
    returns (uint256)
  {
    return allowed[owner][delegate];
  }

  function transferFrom(
    address owner,
    address buyer,
    uint256 numTokens
  ) public override returns (bool) {
    require(numTokens <= balances[owner], "Insufficient balance.");
    require(numTokens <= allowed[owner][msg.sender], "Insufficient allowance.");

    balances[owner] = balances[owner].sub(numTokens);
    allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
    balances[buyer] = balances[buyer].add(numTokens);
    emit Transfer(owner, buyer, numTokens);
    return true;
  }

  function burnTokens(uint256 amount) public {
    _burn(_msgSender(), amount);
    burned[msg.sender] += amount;
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

  modifier mustBeContractPool() {
    require(contractPool(msg.sender), "Not a contract pool");
    _;
  }

  modifier mustHaveSacTokens(address tokenOwner, uint256 numTokens) {
    require(numTokens <= balances[tokenOwner], "You don't have SAC Tokens");
    _;
  }
}
