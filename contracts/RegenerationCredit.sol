// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Regeneration Credit
 * @dev Create and manage the token
 * @notice Token backed by the regeneration impact of the community
 */
contract RegenerationCredit is ERC20, Ownable {
  /// @notice Token name
  string public constant NAME = "REGENERATION CREDIT";

  /// @notice Token symbol
  string public constant SYMBOL = "RC";

  /// @notice Token decimals
  uint8 public constant DECIMALS = 18;

  /// @notice Relationship between address and token balance
  mapping(address => uint256) internal balances;
  mapping(address => mapping(address => uint256)) internal allowed;

  /// @notice Relationship between address and burned tokens
  mapping(address => uint256) public certificate;

  /// @notice Checks if an address is a contract pool
  mapping(address => bool) internal contractsPools;

  /// @notice Total token supply
  uint256 public totalSupply_;

  /// @notice Amount of burned tokens
  uint256 public totalCertified_;

  /// @notice Amount of pool locked tokens
  uint256 public totalLocked_;

  using SafeMath for uint256;

  constructor(uint256 total) ERC20(NAME, SYMBOL) {
    totalSupply_ = total;
    balances[msg.sender] = totalSupply_;
  }

  /**
   * @dev Allows owner to create a token distribution pool
   * @param _fundAddress Contract address
   * @param _numTokens Contract total tokens
   */
  function addContractPool(address _fundAddress, uint256 _numTokens) public onlyOwner returns (bool) {
    contractsPools[_fundAddress] = true;
    transfer(_fundAddress, _numTokens);
    totalLocked_ += _numTokens;

    return true;
  }

  /**
   * @dev Allows contract pools to transfer tokens to user as service for environmental service
   * @param tokenOwner Contract address
   * @param receiver Address to receive the tokens
   * @param numTokens Amount of tokens
   */
  function transferWith(
    address tokenOwner,
    address receiver,
    uint256 numTokens
  ) public mustBeContractPool returns (bool) {
    require(numTokens <= balances[tokenOwner], "You don't have RC Tokens");

    balances[tokenOwner] = balances[tokenOwner].sub(numTokens);
    balances[receiver] = balances[receiver].add(numTokens);
    emit Transfer(tokenOwner, receiver, numTokens);

    unchecked {
      if (contractsPools[tokenOwner]) totalLocked_ -= numTokens;
    }

    return true;
  }

  /**
   * @notice Checks if an address is a contract pool
   */
  function contractPool(address contractFundsAddress) public view returns (bool) {
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

  /**
   * @dev Allows any user to burn tokens
   * @notice Compensate degradation by burning tokens and receive a certificate
   * @param amount Tokens burned
   */
  function burnTokens(uint256 amount) public {
    burnTokensInternal(msg.sender, amount);
  }

  function burnTokensWith(address tokenOwner, uint256 amount) public mustBeContractPool {
    burnTokensInternal(tokenOwner, amount);
  }

  /**
   * @dev Internal function to add burned tokens to the certificate
   */
  function burnTokensInternal(address tokenOwner, uint256 amount) internal {
    _burn(tokenOwner, amount);
    certificate[tokenOwner] += amount;
    totalCertified_ += amount;
  }

  /**
   * @dev Burn the tokens
   */
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

  /**
   * @notice Total certified tokens
   */
  function totalCertified() public view returns (uint256) {
    return totalCertified_;
  }

  /**
   * @notice Total tokens locked at pools
   */
  function totalLocked() public view returns (uint256) {
    return totalLocked_;
  }

  /**
   * @dev Modifier to only contract pools
   */
  modifier mustBeContractPool() {
    require(contractPool(msg.sender), "Not a contract pool");
    _;
  }
}
