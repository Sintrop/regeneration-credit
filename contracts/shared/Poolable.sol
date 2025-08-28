// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { Era } from "contracts/types/PoolTypes.sol";

/**
 * @title Poolable
 * @author Sintrop
 * @notice Manages token distribution logic across different eras based on user levels and a halving mechanism.
 * @dev This abstract contract provides the core functionalities for calculating token allocations,
 * tracking user participation (levels and withdrawals) within specific eras, and managing the pool token supply.
 * It is designed to be inherited by other pool contracts.
 */
contract Poolable {
  // --- State variables ---

  /// @notice The total supply of tokens to be managed by this contract.
  /// @dev This value is set once during contract deployment and remains constant.
  uint256 internal immutable totalTokens;

  /// @dev Stores data for each era. Key is the era number.
  /// @notice Era data includes: count of claims/withdrawals, total tokens claimed, and total active levels or difficulty.
  mapping(uint256 => Era) public eras;

  /// @dev Tracks the levels of each user per era. Mapping: eraNumber => userAddress => levels.
  mapping(uint256 => mapping(address => uint256)) public eraLevels;

  /// @dev Tracks the tokens claimed by each user per era. Mapping: eraId => userAddress => eraTokens.
  mapping(uint256 => mapping(address => uint256)) public eraTokens;

  /// @notice Tracks withdrawals to ensure a user can only claim rewards once per era.
  mapping(uint256 => mapping(address => bool)) public hasWithdrawn;

  // --- Constructor ---

  /**
   * @dev Initializes the contract with the total amount of tokens for the pool.
   * @param _totalTokens The total supply of tokens to be managed by this contract.
   */
  constructor(uint256 _totalTokens) {
    totalTokens = _totalTokens;
  }

  // --- View Functions ---

  /**
   * @notice Returns the aggregated data for a specific era.
   * @dev Provides access to `claimsCount`, `tokens` claimed, and `levels` for the requested era.
   * @param era The number of the era to retrieve data for.
   * @return Era The `Era` struct containing the aggregated details for the specified era.
   */
  function getEra(uint256 era) external view returns (Era memory) {
    return eras[era];
  }

  /**
   * @dev Returns the amount of tokens to be distributed to users in current era.
   * @notice Tokens of actual ERA.
   * @param currentEpoch The current epoch number, used to determine halving mechanism.
   * @param halvingFactor The number of eras for halving.
   */
  function tokensPerEra(uint256 currentEpoch, uint256 halvingFactor) public view returns (uint256) {
    return tokensPerEpoch(currentEpoch) / halvingFactor;
  }

  /**
   * @dev Calculates the base amount of tokens to be distributed in an epoch.
   * @notice Tokens halve with each successive epoch: totalTokens / (2^currentEpoch).
   * @param currentEpoch The current epoch number.
   * @return The amount of tokens for the epoch.
   */
  function tokensPerEpoch(uint256 currentEpoch) public view returns (uint256) {
    return totalTokens / (2 ** currentEpoch);
  }

  // --- Internal Functions (State Modifying) ---

  /**
   * @notice Calculates the amount of tokens a user is eligible to withdraw in a specific era.
   * @dev The calculation is based on the user's levels relative to the total levels in that era.
   * @param era Era number.
   * @param to UserAddress.
   * @param _tokensPerEra The total tokens available for distribution in this specific era.
   * @return The amount of tokens the user can claim. Returns 0 if the user has no levels.
   */
  function _calculateUserEraTokens(uint256 era, address to, uint256 _tokensPerEra) internal view returns (uint256) {
    uint256 levels = eras[era].levels;
    uint256 levelTo = eraLevels[era][to];

    // Return 0 if the user has no levels or there are no levels at all in the era to prevent division by zero.
    if (levelTo == 0 || levels == 0) return 0;

    return (levelTo * _tokensPerEra) / levels;
  }

  /**
   * @notice Private function to check if a user have tokens to withdraw at an era.
   * @param delegate User address.
   * @param era User current era.
   * @param _tokensPerEra Pool tokensPerEra.
   * @return bool True if have tokens to withdraw, false if will just update era.
   */
  function _haveTokensToWithdraw(address delegate, uint256 era, uint256 _tokensPerEra) internal view returns (bool) {
    uint256 numTokens = _calculateUserEraTokens(era, delegate, _tokensPerEra);

    return numTokens > 0;
  }

  /**
   * @dev Updates era data after a user withdraw.
   * @notice This function should be called internally after a successful token withdrawal process.
   * It increments the era's claims count and total tokens claimed.
   * @param era The number of the era.
   * @param user The address of the user who claimed tokens.
   * @param numTokens The amount of tokens claimed by the user.
   */
  function _updateEraAfterWithdraw(uint256 era, address user, uint256 numTokens) internal {
    eras[era].claimsCount++;
    eras[era].tokens += numTokens;
    eraTokens[era][user] = numTokens;

    // Emit event after successful withdrawal update
    emit TokensWithdrawn(user, era, numTokens);
  }

  /**
   * @dev Adds pool levels to a user for a specific era.
   * @param to The address of the user.
   * @param levels The amount of levels to add.
   * @param era The number of the era.
   */
  function _addPoolLevel(address to, uint256 levels, uint256 era) internal {
    eras[era].levels = eras[era].levels + levels;
    eraLevels[era][to] += levels;
    // Emit event after levels are added
    emit PoolLevelAdded(to, era, levels, eras[era].levels, eraLevels[era][to]);
  }

  /**
   * @dev Removes pool levels users.
   * @param _user The address of the user.
   * @param _era The number of the era.
   * @param _amountToRemove The amount of levels to remove.
   */
  function _removePoolLevel(address _user, uint256 _era, uint256 _amountToRemove) internal {
    uint256 userCurrentEraLevels = eraLevels[_era][_user];

    if (userCurrentEraLevels == 0) return;

    if (_amountToRemove > userCurrentEraLevels) _amountToRemove = userCurrentEraLevels;

    eras[_era].levels -= _amountToRemove;
    eraLevels[_era][_user] -= _amountToRemove;

    emit PoolLevelRemoved(_user, _era, _amountToRemove, eras[_era].levels, eraLevels[_era][_user]);
  }

  modifier hasWithdrawnEraModifier(uint256 era, address delegate) {
    require(!hasWithdrawn[era][delegate], "Already withdrawn for this era");
    _;
  }

  // --- Events ---

  /// @notice Emitted when a user's pool levels are added for a specific era.
  /// @param user The address of the user whose levels were added.
  /// @param era The era number where levels were added.
  /// @param levelsAdded The amount of levels added.
  /// @param newTotalEraLevels The new total levels for the era.
  /// @param newEraUserLevels The new total levels for the user in that era.
  event PoolLevelAdded(
    address indexed user,
    uint256 era,
    uint256 levelsAdded,
    uint256 newTotalEraLevels,
    uint256 newEraUserLevels
  );

  /// @notice Emitted when a user's pool levels are removed for a specific era.
  /// @param user The address of the user whose levels were removed.
  /// @param era The era number where levels were removed.
  /// @param levelsRemoved The amount of levels removed.
  /// @param newTotalEraLevels The new total levels for the era.
  /// @param newEraUserLevels The new total levels for the user in that era.
  event PoolLevelRemoved(
    address indexed user,
    uint256 era,
    uint256 levelsRemoved,
    uint256 newTotalEraLevels,
    uint256 newEraUserLevels
  );

  /// @notice Emitted when a user successfully withdrawals tokens for a specific era.
  /// @param user The address of the user who withdrew tokens.
  /// @param era The era number from which tokens were withdrawn.
  /// @param amount The amount of tokens withdrawn.
  event TokensWithdrawn(address indexed user, uint256 era, uint256 amount);
}
