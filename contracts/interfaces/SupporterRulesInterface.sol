// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

interface SupporterRulesInterface {

  function offset(uint256 amount, uint64 calculatorItemId) external;

  function publish(uint256 amount, string memory description, string memory content) external;

}
