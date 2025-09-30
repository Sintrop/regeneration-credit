// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @title ValidationPool
 * @author Sintrop
 * @notice This contract manages the distribution of Regeneration Credit tokens as rewards to validators.
 * @dev Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
 * `Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control).
 */
contract ValidationPool is Poolable, Blockable, Callable, ReentrancyGuard {
  // --- Constants & state variables ---

  /// @notice Interface to the Regeneration Credit token contract, used to decrease total locked.
  IRegenerationCredit public regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this validation pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 private constant TOTAL_POOL_TOKENS = 10000000e18;

  /// @notice Maximum possible level from a single resource.
  uint8 private constant RESOURCE_LEVEL = 1;

  /// @notice The address of the `ValidationRules` contract.
  address public validationRulesAddress;

  /// @notice Tracks unique resource IDs to ensure levels for a resource are added only once.
  mapping(address => bool) public hasProcessedLevel;

  // --- Constructor ---

  /**
   * @dev Initializes the ValidationPool contract.
   * Sets up the Regeneration Credit token interface and initializes inherited base contracts.
   * @param regenerationCreditAddress The address of the RegenerationCredit token contract.
   * @param _halving The number of eras that constitute one halving cycle/epoch for reward adjustments.
   * Passed to the `Blockable` base contract.
   * @param _blocksPerEra The number of blocks that constitute a single era.
   * Passed to the `Blockable` base contract.
   */
  constructor(
    address regenerationCreditAddress,
    uint256 _halving,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _halving) Poolable(TOTAL_POOL_TOKENS) {
    regenerationCredit = IRegenerationCredit(regenerationCreditAddress);
  }

  // --- Deploy functions ---

  /**
   * @dev onlyOwner function to set contract call addresses.
   * This function must be called only once after the contract deploy and ownership must be renounced.
   * @param _validationRulesAddress Address of ValidationRules.
   */
  function setContractCall(address _validationRulesAddress) external onlyOwner {
    validationRulesAddress = _validationRulesAddress;
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller, the Validation contract, to trigger a token withdrawal for a user.
   * This function calculates the eligible tokens for the user's era and transfers them.
   * @notice This function can only be called by the ValidationRules contract, whitelisted via the `Callable` contract's mechanisms.
   * The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.
   * @param delegate The address of the user (validation) for whom the withdrawal is being processed.
   * @param era The last recorded era of the `delegate` user, used for reward calculation and eligibility.
   */
  function withdraw(
    address delegate,
    uint256 era
  )
    external
    mustBeAllowedCaller
    mustBeContractCall(validationRulesAddress)
    canWithdrawModifier(era)
    hasWithdrawnEraModifier(era, delegate)
    nonReentrant
  {
    require(era <= currentContractEra(), "Era in the future");

    hasWithdrawn[era][delegate] = true;

    // Calculate the number of tokens the user is eligible to receive for the given era.
    uint256 numTokens = _calculateUserEraTokens(era, delegate, tokensPerEra(getEpochForEra(era), halving));

    // Update the user's era and token balance state after the withdrawal.
    _updateEraAfterWithdraw(era, delegate, numTokens);

    // If no tokens are to be transferred, return.
    if (numTokens == 0) return;

    regenerationCredit.decreaseLocked(numTokens);

    // Transfer the calculated tokens from this contract to the delegate.
    bool success = regenerationCredit.transfer(delegate, numTokens);
    require(success, "ERC20: transfer failed");
  }

  /**
   * @dev Allows an authorized caller to increase the user pool level.
   * This function updates the validation level within the system's pooling mechanism.
   * @notice Can only be called by the validationRules address.
   * @param addr The wallet address of the validation.
   * @param denied The address of the denied user.
   */
  function addLevel(
    address addr,
    address denied
  ) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) nonReentrant {
    require(!hasProcessedLevel[denied], "User already processed");
    hasProcessedLevel[denied] = true;

    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(addr, RESOURCE_LEVEL, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to increase the user pool level.
   * This function updates the validation level within the system's pooling mechanism.
   * @notice Can only be called by the validationRules address.
   * @param addr The wallet address of the validation.
   */
  function addPointsLevel(
    address addr
  ) external mustBeAllowedCaller mustBeContractCall(validationRulesAddress) nonReentrant {
    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(addr, RESOURCE_LEVEL, currentContractEra());
  }

  // --- View functions ---

  /**
   * @notice View function to check if a user have tokens to withdraw at an era.
   * @param delegate User address.
   * @param era User current era.
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function haveTokensToWithdraw(address delegate, uint256 era) external view returns (bool) {
    return _haveTokensToWithdraw(delegate, era, tokensPerEra(getEpochForEra(era), halving));
  }
}
