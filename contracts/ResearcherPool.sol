// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { Blockable } from "./shared/Blockable.sol";
import { Callable } from "./shared/Callable.sol";
import { Poolable } from "./shared/Poolable.sol";

/**
 * @title ResearcherPool
 * @author Sintrop
 * @notice This contract manages the distribution of Regeneration Credit tokens as rewards to researchers
 * for their research and methodology improvement service provided.
 * The reward is distributed related to the number of valid published researches.
 * @dev Inherits core functionalities from `Poolable` (for pool management), `Ownable` (for deploy setup only),
 * `Blockable` (for era/epoch tracking), and `Callable` (for whitelisted caller control).
 */
contract ResearcherPool is Poolable, Blockable, Callable, ReentrancyGuard {
  // --- Constants & state variables ---

  /// @notice Interface to the Regeneration Credit token contract, used to decrease total locked.
  IRegenerationCredit public regenerationCredit;

  /// @notice The total supply of Regeneration Credit tokens designated for this researcher pool.
  /// This value represents the maximum tokens available for distribution through this contract.
  uint256 private constant TOTAL_POOL_TOKENS = 40000000e18;

  /// @notice Maximum possible level from a single resource.
  uint8 private constant RESOURCE_LEVEL = 1;

  /// @notice The address of the `ResearcherRules` contract.
  address public researcherRulesAddress;

  /// @notice Tracks unique resource IDs to ensure levels for a resource are added only once.
  mapping(uint64 => bool) public hasProcessedLevel;

  // --- Constructor ---

  /**
   * @dev Initializes the ResearcherPool contract.
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
   * @param _researcherRulesAddress Address of DeveloperRules.
   */
  function setContractCall(address _researcherRulesAddress) external onlyOwner {
    researcherRulesAddress = _researcherRulesAddress;
  }

  // --- MustBeAllowedCaller functions (State modifying) ---

  /**
   * @dev Allows an authorized caller, the Researcher contract, to trigger a token withdrawal for a user.
   * This function calculates the eligible tokens for the user's era and transfers them.
   * @notice This function can only be called by the ResearcherRules contract, whitelisted via the `Callable` contract's mechanisms.
   * The user must also be eligible for withdrawal based on the `Blockable` contract's era tracking.
   * @param delegate The address of the user (researcher) for whom the withdrawal is being processed.
   * @param era The last recorded era of the `delegate` user, used for reward calculation and eligibility.
   */
  function withdraw(
    address delegate,
    uint256 era
  )
    external
    mustBeAllowedCaller
    mustBeContractCall(researcherRulesAddress)
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
   * This function updates the researcher level within the system's pooling mechanism.
   * @notice Can only be called by the researcherRules address.
   * @param addr The wallet address of the researcher.
   * @param levels The number of levels to increase the researcher's pool level by.
   * @param eventId The ID of the research being processed.
   */
  function addLevel(
    address addr,
    uint256 levels,
    uint64 eventId
  ) external mustBeAllowedCaller mustBeContractCall(researcherRulesAddress) nonReentrant {
    require(levels <= RESOURCE_LEVEL, "Exceeds max levels");
    require(!hasProcessedLevel[eventId], "Event already processed");
    hasProcessedLevel[eventId] = true;

    // Calls the _addPoolLevel function from Poolable.sol.
    _addPoolLevel(addr, levels, currentContractEra());
  }

  /**
   * @dev Allows an authorized caller to decrease an researcher's pool level.
   * This function adjusts the researcher's level downwards within the system's pooling mechanism.
   * @notice Can only be called by researcherRules address.
   * @param addr The wallet address of the researcher.
   * @param denied Remove level user status. If true, user is being denied.
   */
  function removePoolLevels(
    address addr,
    bool denied
  ) external mustBeAllowedCaller mustBeContractCall(researcherRulesAddress) nonReentrant {
    uint256 era = currentContractEra();

    uint256 amountToRemovePool = denied ? eraLevels[era][addr] : RESOURCE_LEVEL;
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
