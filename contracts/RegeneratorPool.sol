// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @title RegeneratorPool
 * @author Sintrop
 * @notice This contract manages the distribution of Regeneration Credit tokens as rewards to regenerators
 * for their ecosystem regeneration service provided.
 * The reward is distributed related to the RegenerationScore, the result of each inspection that ranges from [0, 64].
 * @dev Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
 * `Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control).
 */
contract RegeneratorPool is Poolable, Blockable, Callable, ReentrancyGuard {
  // --- Constants & state variables ---

  /// @notice Interface to the Regeneration Credit token contract, used to decrease total locked.
  IRegenerationCredit public regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this regenerator pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 private constant TOTAL_POOL_TOKENS = 750000000e18;

  /// @notice The address of the `RegeneratorRules` contract.
  address public regeneratorRulesAddress;

  /// @notice Maximum possible score from a single resource.
  uint256 public constant MAX_NEW_LEVELS = 192;

  /// @notice Tracks unique resource IDs to ensure levels for a resource are added only once.
  mapping(uint64 => bool) public hasProcessedLevel;

  // --- Constructor ---

  /**
   * @dev Initializes the RegeneratorPool contract.
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
   * @param _regeneratorRulesAddress Address of RegeneratorRules.
   */
  function setContractCall(address _regeneratorRulesAddress) external onlyOwner {
    regeneratorRulesAddress = _regeneratorRulesAddress;
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller, the Regenerator contract, to trigger a token withdrawal for a user.
   * This function calculates the eligible tokens for the user's era and transfers them.
   * @notice This function can only be called by the RegeneratorRules contract, whitelisted via the `Callable` contract's mechanisms.
   * The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.
   * @param delegate The address of the user (regenerator) for whom the withdrawal is being processed.
   * @param era The last recorded era of the `delegate` user, used for reward calculation and eligibility.
   */
  function withdraw(
    address delegate,
    uint256 era
  )
    external
    mustBeAllowedCaller
    mustBeContractCall(regeneratorRulesAddress)
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
   * This function updates the regenerator level within the system's pooling mechanism.
   * @notice Can only be called by the regeneratorRules address.
   * @param regenerator The wallet address of the regenerator.
   * @param levels The number of levels to increase the regenerator's pool level by.
   * @param inspectionId The id of the inspection being processed.
   */
  function addLevel(
    address regenerator,
    uint256 levels,
    uint64 inspectionId
  ) external mustBeAllowedCaller mustBeContractCall(regeneratorRulesAddress) nonReentrant {
    require(levels <= MAX_NEW_LEVELS, "Exceeds max levels");
    require(!hasProcessedLevel[inspectionId], "Event already processed");
    hasProcessedLevel[inspectionId] = true;

    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(regenerator, levels, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to decrease an regenerator's pool level.
   * This function adjusts the regenerator's level downwards within the system's pooling mechanism.
   * @notice Can only be called by regeneratorRules address.
   * @param addr The wallet address of the regenerator.
   * @param amountToRemove The number of levels/score points to decrease.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(
    address addr,
    uint256 amountToRemove,
    bool denied
  ) external mustBeAllowedCaller mustBeContractCall(regeneratorRulesAddress) nonReentrant {
    uint256 era = currentContractEra();

    uint256 amountToRemovePool = denied ? eraLevels[era][addr] : amountToRemove;

    // Calls the _removePoolLevel function from Poolable.sol.
    _removePoolLevel(addr, era, amountToRemovePool);
  }

  // --- View functions ---

  /**
   * @notice View function to check if a user have tokens to withdraw at an era.
   * @param delegate User address.
   * @param era User current era.
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function haveTokensToWithdraw(address delegate, uint256 era) public view returns (bool) {
    return _haveTokensToWithdraw(delegate, era, tokensPerEra(getEpochForEra(era), halving));
  }
}
