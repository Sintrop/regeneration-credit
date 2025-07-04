// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/**
 * @title ISupporterRules
 * @notice Interface for the offseting-related query functionalities of the
 * SupporterRules contract.
 */
interface ISupporterRules {
  function offset(address supporterAddress, uint256 amount, uint64 calculatorItemId) external;

  function publish(address supporterAddress, uint256 amount, string memory description, string memory content) external;

  function isSupporter(address addr) external returns (bool);

  function _calculateCommission(
    address supporterAddress,
    uint256 amount
  ) external returns (uint256 amountToBurn, uint256 commission, address inviter);
}
