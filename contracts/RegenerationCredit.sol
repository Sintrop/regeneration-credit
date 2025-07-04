// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ISupporterRules } from "./interfaces/ISupporterRules.sol";

/**
 * @title RegenerationCredit
 * @author Sintrop
 * @notice Regeneration Credit, token backed by the community's environmental regeneration impact.
 * This contract manages the token's supply, transfers, approvals,
 * and introduces specific functionalities for managing tokens within designated "contract pools"
 * and for burning tokens to certify environmental offset.
 * @dev Inherits from OpenZeppelin's `ERC20` for standard token functionalities and `Ownable` for deploy setup.
 */
contract RegenerationCredit is ERC20, Ownable {
  // --- Constants (Standard ERC-20 Metadata) ---

  /// @notice The official name of the token.
  string public constant NAME = "REGENERATION CREDIT";

  /// @notice Token symbol
  string public constant SYMBOL = "RC";

  /// @notice The number of decimal places used by the token.
  uint8 public constant DECIMALS = 18;

  // --- Custom State Variables ---

  /// @notice A mapping to track whether an address is a designated "contract pool" for token distribution.
  /// Only addresses marked as true here can perform specific actions like `transferWith` and `burnTokensWith`.
  mapping(address => bool) internal contractsPools;

  /// @notice The total amount of tokens that have been permanently burned/retired (certified) across the system.
  /// These tokens are removed from circulation and represent environmental offset.
  uint256 public totalCertified_;

  /// @notice The total amount of tokens that are currently held by designated contract pools.
  uint256 public totalLocked_;

  /// @notice A mapping to track the amount of tokens burned (certified) by a specific user/supporter.
  /// Represents their individual contribution to environmental offset.
  mapping(address => uint256) public certificate;

  /// @notice SupporterRules contract address.
  ISupporterRules private supporterRules;

  // --- Constructor ---

  /**
   * @dev Initializes the RegenerationCredit contract by minting the initial supply.
   * Also sets the token's name, symbol, and decimals via the `ERC20` base constructor.
   * @param totalSupply The total amount of tokens to be minted.
   */
  constructor(uint256 totalSupply) ERC20(NAME, SYMBOL) {
    // Mint the initial supply directly to the deployer using OpenZeppelin's internal _mint function.
    _mint(msg.sender, totalSupply);
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contracts dependency.
   * This function must be called only once after the contract deploy and ownership must be renounced after.
   * @param supporterRulesAddress Addresses of the SupporterRules contract.
   */
  function setContractDependencies(address supporterRulesAddress) public onlyOwner {
    supporterRules = ISupporterRules(supporterRulesAddress);
  }

  /**
   * @dev Allows the contract owner to designate a new address as a "contract pool"
   * and transfer an initial allocation of tokens to it.
   * @notice This function is used to fund and activate distribution pools within the ecosystem.
   * @param _fundAddress The address of the contract to be designated as a pool.
   * @param _numTokens The amount of tokens to transfer to the new pool.
   *
   * Requirements:
   * - Only the contract owner can call this function.
   * - `fundAddress` must not be the zero address.
   * - The contract must have sufficient balance to transfer `numTokens`.
   * - `fundAddress` must not already be a contract pool (optional, but good practice to prevent re-funding issues).
   */
  function addContractPool(address _fundAddress, uint256 _numTokens) public onlyOwner returns (bool) {
    contractsPools[_fundAddress] = true;

    _transfer(msg.sender, _fundAddress, _numTokens);

    // Update total locked tokens.
    totalLocked_ += _numTokens;

    return true;
  }

  // --- Public functions ---

  /**
   * @dev Allows any user to burn their own tokens.
   * @notice Compensate your environmental degradation by burning Regeneration Credit tokens.
   * Burning tokens permanently removes them from circulation and increases your compensation certificate.
   * @param amount The amount of tokens to burn from the caller's balance.
   *
   * Requirements:
   * - The caller (`msg.sender`) must have `amount` tokens.
   * - `amount` must be greater than 0.
   */
  function burnTokens(uint256 amount) public {
    require(amount > 0, "Burn amount must be greater than 0");
    _burnTokensInternal(msg.sender, amount);
  }

  /**
   * @notice Allows a supporter to burn tokens to compensate for a specific item's degradation.
   * @dev Burns tokens. If a valid calculatorItemId is provided, calls the SupporterRules contract
   * that records the burned amount as a certificate for that item.
   * @param amount Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param calculatorItemId The ID of the CalculatorItem, or 0 if not applicable.
   */
  function offset(uint256 amount, uint64 calculatorItemId) public {
    require(supporterRules.isSupporter(msg.sender), "Only supporters");
    require(amount >= 1000000000000000000, "Amount must be at least 1 RC");

    (uint256 amountToBurn, uint256 comission, address inviter) = supporterRules._calculateCommission(
      msg.sender,
      amount
    );

    supporterRules.offset(msg.sender, amountToBurn, calculatorItemId);

    transfer(inviter, comission);
    _burnTokensInternal(msg.sender, amountToBurn);
  }

  /**
   * @notice Allows a supporter to burn tokens to post content.
   * @dev Burns tokens and creates a new publication record.
   * Enforces character limits for description and content.
   * @param amount Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param description The description of the post (max 600 characters).
   * @param content The content of the post (max 600 characters).
   */
  function publish(uint256 amount, string memory description, string memory content) public {
    require(supporterRules.isSupporter(msg.sender), "Only supporters");
    require(amount >= 1000000000000000000, "Amount must be at least 1 RC");
    require(bytes(description).length <= 600 && bytes(content).length <= 600, "Max 600 characters");

    (uint256 amountToBurn, uint256 comission, address inviter) = supporterRules._calculateCommission(
      msg.sender,
      amount
    );

    supporterRules.publish(msg.sender, amountToBurn, description, content);

    transfer(inviter, comission);
    _burnTokensInternal(msg.sender, amountToBurn);
  }

  /**
   * @dev Allows a designated "contract pool" to
   * @param tokenOwner The address of the contract pool initiating the transfer.
   * @param receiver The address of the user who will receive the tokens.
   * @param numTokens The amount of tokens to transfer.
   *
   * Requirements:
   * - Only a registered `contractPool` can call this function (`mustBeContractPool` modifier).
   * - The `tokenOwner` (which is `contractPool` due to modifier) must have sufficient balance.
   */
  function poolTransfer(address tokenOwner, address receiver, uint256 numTokens) public mustBeContractPool {
    require(numTokens <= balanceOf(tokenOwner), "You don't have RC Tokens");

    // Update total locked tokens.
    unchecked {
      if (contractsPools[tokenOwner]) totalLocked_ -= numTokens;
    }
    // Emit event specific to pool transfers.
    emit PoolTransfer(tokenOwner, receiver, numTokens);
  }

  // --- Internal functions ---

  /**
   * @dev Internal function to handle the burning of tokens and updating certification records.
   * It calls the ERC-20 `_burn` function and updates custom `certificate` and `totalCertified_` state variables.
   * @param tokenOwner The address from which tokens are to be burned.
   * @param amount The amount of tokens to burn.
   */
  function _burnTokensInternal(address tokenOwner, uint256 amount) internal {
    // Call OpenZeppelin's internal _burn function to handle the actual burning.
    // _burn handles balance updates, total supply updates, and emits the Transfer event (to address(0)).
    _burn(tokenOwner, amount);

    // Update certification records.
    certificate[tokenOwner] += amount;
    totalCertified_ += amount;

    // Emit event for monitoring and certification.
    emit TokensCertified(tokenOwner, amount, certificate[tokenOwner]);
  }

  // --- View functions ---

  /**
   * @notice Returns the total amount of tokens that have been permanently burned/retired (certified) across the system.
   * @return uint256 The total certified tokens.
   */
  function totalCertified() public view returns (uint256) {
    return totalCertified_;
  }

  /**
   * @notice Returns the total amount of tokens that are currently held by designated contract pools.
   * @return uint256 The total tokens locked in pools.
   */
  function totalLocked() public view returns (uint256) {
    return totalLocked_;
  }

  /**
   * @notice Checks if a given address is a designated "contract pool" in the system.
   * @param poolAddress The address to check.
   * @return bool `true` if the address is a contract pool, `false` otherwise.
   */
  function contractPool(address poolAddress) public view returns (bool) {
    return contractsPools[poolAddress];
  }

  // --- Modifiers ---

  /**
   * @dev Modifier that restricts a function's execution to only addresses that are
   * designated as "contract pools" in the `contractsPools` mapping.
   */
  modifier mustBeContractPool() {
    require(contractPool(msg.sender), "Not a contract pool");
    _;
  }

  // --- Events ---

  /// @dev Emitted when tokens are transferred from a designated contract pool to a user.
  /// @param from The address of the contract pool.
  /// @param to The address of the recipient.
  /// @param amount The amount of tokens transferred.
  event PoolTransfer(address indexed from, address indexed to, uint256 amount);

  /// @dev Emitted when tokens are burned (certified) by a user or on behalf of a pool.
  /// @param account The address from which tokens were burned.
  /// @param amount The amount of tokens burned.
  /// @param newAccountCertifiedTotal The total amount of tokens certified by `account`.
  event TokensCertified(address indexed account, uint256 amount, uint256 newAccountCertifiedTotal);
}
