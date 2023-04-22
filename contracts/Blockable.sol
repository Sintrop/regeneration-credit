// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title Blockable
 * @dev Blockable is a contract to manage blocks eras
 */
contract Blockable {
  using SafeMath for uint256;

  uint256 public constant BLOCKS_PRECISION = 5;

  uint256 public blocksPerEra;
  uint256 public deployedAt;
  uint256 public eraMax;

  constructor(uint256 _blocksPerEra, uint256 _eraMax) {
    blocksPerEra = _blocksPerEra;
    eraMax = _eraMax;
    deployedAt = currentBlockNumber();
  }

  function canApprove(uint256 currentUserEra) public view returns (bool) {
    return currentUserEra < currentContractEra() && validEra(currentUserEra);
  }

  function currentContractEra() public view returns (uint256) {
    return currentBlockNumber().sub(deployedAt).div(blocksPerEra).add(1);
  }

  function nextApproveIn(uint256 currentUserEra) public view returns (int256) {
    return int256(deployedAt) + (int256(blocksPerEra) * int256(currentUserEra)) - int256(currentBlockNumber());
  }

  function canApproveTimes(uint256 currentUserEra) public view returns (uint256) {
    int256 approvesTimes = nextApproveIn(currentUserEra);

    if (approvesTimes > 0) return 0;

    return uint256(-approvesTimes).mul(10 ** BLOCKS_PRECISION).div(blocksPerEra);
  }

  // PRIVATE FUNCTIONS

  function validEra(uint256 currentEra) internal view returns (bool) {
    return currentEra <= eraMax;
  }

  function currentUserBlockNumber(uint256 currentUserEra) internal view returns (uint256) {
    return deployedAt.add(blocksPerEra.mul(currentUserEra));
  }

  function currentBlockNumber() internal view returns (uint256) {
    return block.number;
  }
}
