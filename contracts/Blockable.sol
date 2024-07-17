// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Blockable
 * @dev Blockable is a contract to manage blocks eras
 */
contract Blockable {
  using SafeMath for uint256;

  uint256 public constant BLOCKS_PRECISION = 5;
  uint256 internal constant LIMIT_EPOCHS_SIZE = 8;
  uint256 private immutable BLOCKS_PER_ERA;
  uint256 private immutable DEPLOYED_AT;
  uint256 private immutable LIMIT_ERAS_SIZE;
  uint256 internal immutable HALVING;

  constructor(uint256 blocksPerEra, uint256 _limitErasSize, uint256 _halving) {
    BLOCKS_PER_ERA = blocksPerEra;
    LIMIT_ERAS_SIZE = _limitErasSize;
    DEPLOYED_AT = currentBlockNumber();
    HALVING = _halving;
  }

  function canApprove(uint256 currentUserEra) public view returns (bool) {
    return currentUserEra < currentContractEra() && isAValidEra(currentUserEra);
  }

  function currentContractEra() public view returns (uint256) {
    return currentBlockNumber().sub(DEPLOYED_AT).div(BLOCKS_PER_ERA).add(1);
  }

  function currentEpoch() public view returns (uint256) {
    return currentContractEra().div(HALVING).add(1);
  }

  function nextApproveIn(uint256 currentUserEra) public view returns (int256) {
    return int256(DEPLOYED_AT) + (int256(BLOCKS_PER_ERA) * int256(currentUserEra)) - int256(currentBlockNumber());
  }

  function canApproveTimes(uint256 currentUserEra) public view returns (uint256) {
    int256 approvesTimes = nextApproveIn(currentUserEra);

    if (approvesTimes > 0) return 0;

    return uint256(-approvesTimes).mul(10 ** BLOCKS_PRECISION).div(BLOCKS_PER_ERA);
  }

  // PRIVATE FUNCTIONS

  function isAValidEra(uint256 currentEra) internal view returns (bool) {
    return currentEra <= LIMIT_ERAS_SIZE;
  }

  function isAValidEpoch() internal view returns (bool) {
    return currentEpoch() <= LIMIT_EPOCHS_SIZE;
  }

  function currentUserBlockNumber(uint256 currentUserEra) internal view returns (uint256) {
    return DEPLOYED_AT.add(BLOCKS_PER_ERA.mul(currentUserEra));
  }

  function currentBlockNumber() internal view returns (uint256) {
    return block.number;
  }
}
