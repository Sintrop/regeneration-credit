// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title RegenerationCredit
 * @author Sintrop
 * @notice Regeneration Credit, token backed by the community's environmental regeneration impact.
 * This contract manages the token's supply, transfers, approvals,
 * and introduces specific functionalities for managing tokens within designated "contract pools"
 * and for burning tokens to certify environmental offset.
 * @dev Inherits from OpenZeppelin's `ERC20` for standard token functionalities and `Ownable` for deploy setup.
 */
contract RegenerationCredit is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
  // --- Constants (Standard ERC-20 Metadata) ---

  /// @notice The official name of the token.
  string public constant NAME = "REGENERATION CREDIT";

  /// @notice Token symbol.
  string public constant SYMBOL = "RC";

  /// @notice The number of decimal places used by the token.
  uint8 public constant DECIMALS = 18;

  // --- Custom State Variables ---

  /// @notice A mapping to track whether an address is a designated "contract pool" for token distribution.
  mapping(address => bool) private contractsPools;

  /// @notice The total amount of tokens that have been permanently burned/retired (certified) across the system.
  /// These tokens are out from circulation and represent environmental offset.
  uint256 public totalCertified_;

  /// @notice The total amount of tokens that are currently held by designated contract pools.
  uint256 public totalLocked_;

  /// @notice A mapping to track the amount of tokens burned (certified) by a specific user/supporter.
  /// Represents their individual contribution to environmental offset.
  mapping(address => uint256) public certificate;

  // --- Constructor ---

  /**
   * @dev Initializes the RegenerationCredit contract by minting the initial supply.
   * Also sets the token's name, symbol, and decimals via the `ERC20` base constructor.
   * @param totalSupply The total amount of tokens to be minted.
   */
  constructor(uint256 totalSupply) ERC20(NAME, SYMBOL) Ownable(msg.sender) {
    // Mint the initial supply directly to the deployer using OpenZeppelin's internal _mint function.
    _mint(msg.sender, totalSupply);
  }

  /**
   * @dev Allows the contract owner to designate a new address as a "contract pool"
   * and transfer an initial allocation of tokens to it. Tokens are set as locked when transfered to the pool.
   * @notice This function is used to fund and activate distribution pools within the ecosystem.
   *
   * Requirements:
   * - Only the contract owner can call this function.
   * - `fundAddress` must not be the zero address.
   * - The caller must have sufficient balance to transfer `numTokens`.
   *
   * @param _fundAddress The address of the contract to be designated as a pool.
   * @param _numTokens The amount of tokens to transfer to the new pool.
   */
  function addContractPool(address _fundAddress, uint256 _numTokens) external onlyOwner returns (bool) {
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
   *
   * Requirements:
   * - The caller (`msg.sender`) must have `amount` tokens.
   * - `amount` must be greater than 0.
   *
   * Note: This functions uses the token 18 decimals, to burn 1 RC user must write 1000000000000000000.
   *
   * @param amount The amount of tokens to burn from the caller's balance.
   */
  function burnTokens(uint256 amount) external {
    require(amount > 0, "Burn amount must be greater than 0");
    _burnTokensInternal(msg.sender, amount);
  }

  /**
   * @notice Destroys a specific amount of tokens from a target account and updates certification records.
   * @dev Overrides the standard ERC20Burnable `burnFrom` to include custom certification logic
   * by calling the internal `_burnTokensInternal` function.
   * @param account The address of the token holder whose tokens will be burned.
   * @param amount The amount of tokens to burn.
   */
  function burnFrom(address account, uint256 amount) public override {
    _spendAllowance(account, msg.sender, amount);
    _burnTokensInternal(account, amount);
  }

  /**
   * @dev Allows a designated "contract pool" to register a new decreaseLocked.
   * @notice Called only by a system pool contract, this function remove the transfered tokens from totalLocked.
   * @param numTokens The amount of tokens to transfer.
   */
  function decreaseLocked(uint256 numTokens) external mustBeContractPool {
    require(numTokens <= balanceOf(msg.sender), "Pool out of balance");
    require(numTokens <= totalLocked_, "Cannot decrease more than total locked");

    if (contractsPools[msg.sender]) totalLocked_ -= numTokens;
  }

  // --- Private functions ---

  /**
   * @dev Private function to handle the burning of tokens and updating certification records.
   * It calls the ERC-20 `_burn` function and updates custom `certificate` and `totalCertified_` state variables.
   * @param tokenOwner The address from which tokens are to be burned.
   * @param amount The amount of tokens to burn.
   */
  function _burnTokensInternal(address tokenOwner, uint256 amount) private {
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

  /// @dev Emitted when tokens are burned (certified) by a user.
  /// @param account The address from which tokens were burned.
  /// @param amount The amount of tokens burned.
  /// @param newAccountCertifiedTotal The total amount of tokens certified by `account`.
  event TokensCertified(address indexed account, uint256 amount, uint256 newAccountCertifiedTotal);
}
