// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @notice Tracks the inspection impact of an Era.
 * @dev This struct is used to register the impact of all inspection of an Era.
 * @param trees Trees count.
 * @param biodiversity Biodiversity count.
 */
struct EraImpact {
  uint256 trees;
  uint256 biodiversity;
}
