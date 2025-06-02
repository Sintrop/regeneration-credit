// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Blockable
 * @dev Contract to manage time, blocks and eras
 */
contract Blockable {
  using SafeMath for uint256;

  uint256 public constant BLOCKS_PRECISION = 5;

  /// @notice Amount of blocks per ERA.
  uint256 private immutable BLOCKS_PER_ERA;

  /// @notice Contract deploy block.number.
  uint256 private immutable DEPLOYED_AT;

  /// @notice Blocks to reduce rewards.
  uint256 internal immutable HALVING;

  constructor(uint256 blocksPerEra, uint256 _halving) {
    BLOCKS_PER_ERA = blocksPerEra;
    DEPLOYED_AT = currentBlockNumber();
    HALVING = _halving;
  }

  /**
   * @dev Checks if an user can withdraw rewards.
   * @param currentUserEra Current user pool era, passed by pool contracts.
   * @return bool True if currentUserEra is smaller than contractEra. False if not.
   */
  function canWithdraw(uint256 currentUserEra) public view returns (bool) {
    return currentUserEra < currentContractEra();
  }

  /**
   * @dev Function to calculate the contract current ERA.
   * @return uint256 Current contract ERA.
   */
  function currentContractEra() public view returns (uint256) {
    return currentBlockNumber().sub(DEPLOYED_AT).div(BLOCKS_PER_ERA).add(1);
  }

  /**
   * @dev Function to calculate the contract current EPOCH.
   * @return uint256 Current contract EPOCH.
   */
  function currentEpoch() public view returns (uint256) {
    return currentContractEra().div(HALVING).add(1);
  }

  /**
   * @dev Function to calculate the epoch based on an era.
   * @return uint256 Current era EPOCH.
   */
  function currentUserEpoch(uint256 era) public view returns (uint256) {
    return era.div(HALVING).add(1);
  }

  /**
   * @dev Function to calculate the amount of blocks remaining to change the contract ERA.
   * @return int256 Amount of blocks to change ERA.
   */
  function nextEraIn(uint256 currentUserEra) public view returns (int256) {
    return int256(DEPLOYED_AT) + (int256(BLOCKS_PER_ERA) * int256(currentUserEra)) - int256(currentBlockNumber());
  }

  function canWithdrawTimes(uint256 currentUserEra) public view returns (uint256) {
    int256 approvesTimes = nextEraIn(currentUserEra);

    if (approvesTimes > 0) return 0;

    return uint256(-approvesTimes).mul(10 ** BLOCKS_PRECISION).div(BLOCKS_PER_ERA);
  }

  // PRIVATE FUNCTIONS

  function currentBlockNumber() internal view returns (uint256) {
    return block.number;
  }

  // MODIFIERS

  modifier canWithdrawModifier(uint256 era) {
    require(canWithdraw(era), "You can't approve yet");
    _;
  }
}
