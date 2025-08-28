// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title Blockable
 * @author Sintrop
 * @notice Contract to manage time-related calculations based on block numbers, including eras and epochs.
 * @dev Provides utility functions to determine current era, epoch, and eligibility for actions based on block progression.
 * Eras and Epochs are 1-indexed.
 */
contract Blockable {
  // --- Constants and Immutables ---

  /// @dev Precision factor used in calculations.
  uint256 public constant BLOCKS_PRECISION = 5;

  /// @notice The number of blocks that constitute a single ERA.
  uint256 private immutable blocksPerEra;

  /// @notice The block number at which this contract was deployed.
  uint256 private immutable deployedAt;

  /// @dev Used to determine epoch changes, linked to reward halving adjustments
  /// @notice Defines the number of eras that form one EPOCH cycle.
  uint256 internal immutable halving;

  // --- Constructor ---

  /**
   * @dev Initializes the Blockable contract.
   * @param _blocksPerEra The number of blocks in each era. Must be greater than 0.
   * @param _halving The number of eras that constitute one halving cycle/epoch.
   */

  constructor(uint256 _blocksPerEra, uint256 _halving) {
    blocksPerEra = _blocksPerEra;
    deployedAt = _currentBlockNumber();
    halving = _halving;
  }

  // --- Public View Functions ---

  /**
   * @dev Checks if a user, based on their current era, is eligible for a withdraw.
   * @notice The user will be eligible for a withdrawal when their era is lower than the current contract era.
   * @param currentUserEra The user's current era.
   * @return bool True if currentUserEra is less than the contract's current era, false otherwise.
   */
  function canWithdraw(uint256 currentUserEra) public view returns (bool) {
    return currentUserEra < currentContractEra();
  }

  /**
   * @dev Calculates the current era of the contract based on block progression since deployment.
   * @notice Get the current contract era.
   * @return uint256 The current contract era.
   */
  function currentContractEra() public view returns (uint256) {
    uint256 blocksSinceDeployment = _currentBlockNumber() - deployedAt;

    return blocksSinceDeployment / blocksPerEra + 1;
  }

  /**
   * @dev Calculates the current EPOCH of the contract.
   * @notice Epochs are 1-indexed. The calculation ensures that each epoch (including the first)
   * comprises exactly `halving` eras, aligning with a conceptual 0-indexed era system for epoch grouping.
   * For example, assuming halving = 12:
   * Eras 1-12 (contract era numbers) -> Epoch 1
   * Eras 13-24 (contract era numbers) -> Epoch 2
   * And so on.
   * @return uint256 Current contract EPOCH.
   */
  function currentEpoch() public view returns (uint256) {
    return getEpochForEra(currentContractEra());
  }

  /**
   * @dev Calculates the epoch for a given era number.
   * @notice Follows the same calculation logic as `currentEpoch`.
   * @param era The era number to determine the epoch for.
   * @return uint256 The epoch corresponding to the given era.
   */
  function getEpochForEra(uint256 era) public view returns (uint256) {
    require(era > 0, "Era must be greater than 0");
    // Subtract 1 from the given era to align with a 0-indexed concept for epoch calculation,
    // then divide by halving and add 1 to get the 1-indexed epoch number.
    return (era - 1) / halving + 1;
  }

  /**
   * @dev Calculates the number of blocks remaining until the start of the next era.
   * @param targetEra The era for which to calculate the remaining blocks until its completion.
   * @return int256 Number of blocks until the next era begins. Positive if targetEra is ongoing,
   * negative if targetEra has passed, zero if the current block is the first block of the next era.
   */
  function nextEraIn(uint256 targetEra) public view returns (int256) {
    require(targetEra > 0, "Target era must be greater than 0");

    // Target block is the first block of the (targetEra + 1)
    // Which is deployedAt + (targetEra * blocksPerEra)
    uint256 endBlockOfTargetEra = deployedAt + (targetEra * blocksPerEra);
    return int256(endBlockOfTargetEra) - int256(_currentBlockNumber());
  }

  /**
   * @dev Calculates a scaled value representing how many "blocksPerEra" periods have elapsed
   * since a given currentUserEra ended.
   * @notice Returns 0 if currentUserEra has not yet ended.
   * The result is scaled by 10**BLOCKS_PRECISION. For example, if 1.5 eras have passed,
   * and BLOCKS_PRECISION is 5, it returns 150000.
   * @param currentUserEra The era that the user has completed.
   * @return uint256 Scaled representation of elapsed eras past currentUserEra.
   */
  function canWithdrawTimes(uint256 currentUserEra) public view returns (uint256) {
    int256 blocksUntilEndOfUserEra = nextEraIn(currentUserEra);

    if (blocksUntilEndOfUserEra > 0) {
      // currentUserEra has not yet ended, or is the current block.
      return 0;
    }

    // blocksUntilEndOfUserEra is <= 0.
    // Number of blocks passed since currentUserEra ended.
    uint256 blocksPassed = uint256(-blocksUntilEndOfUserEra);

    // (blocksPassed / blocksPerEra) * (10**BLOCKS_PRECISION)
    return (blocksPassed * (10 ** BLOCKS_PRECISION)) / blocksPerEra;
  }

  // --- Internal View Functions ---

  /**
   * @dev Returns the current block number.
   * @return uint256 The current block.number.
   */
  function _currentBlockNumber() internal view returns (uint256) {
    return block.number;
  }

  // --- Modifiers ---

  /**
   * @dev Modifier to restrict a function's execution until the provided `era` has passed
   * relative to the contract's current era.
   * @param era The user's current recorded era.
   */
  modifier canWithdrawModifier(uint256 era) {
    require(canWithdraw(era), "You can't approve yet");
    _;
  }
}
