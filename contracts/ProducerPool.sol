// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SacTokenInterface.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Blockable.sol";
import "./Callable.sol";

/**
 * @author Sintrop
 * @title ProducerPool
 * @dev ProducerPool is a contract to reward producers
 */
contract ProducerPool is Ownable, Blockable, Callable {
  using SafeMath for uint256;

  uint256 internal immutable halving;
  uint256 internal immutable totalEras;

  SacTokenInterface internal sacToken;

  uint256[8] internal tokensPerEpochs = [
    360000000000000000000000000,
    180000000000000000000000000,
    90000000000000000000000000,
    45000000000000000000000000,
    22500000000000000000000000,
    11250000000000000000000000,
    5625000000000000000000000,
    2812500000000000000000000
  ];

  constructor(
    address sacTokenAddress,
    uint256 _halving,
    uint256 _totalEras,
    uint256 _blocksPerEra
  ) Blockable(_blocksPerEra, _totalEras) {
    sacToken = SacTokenInterface(sacTokenAddress);
    halving = _halving;
    totalEras = _totalEras;
  }

  /**
   * @dev Returns how much tokens the contract has
   */
  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  /**
   * @dev Returns how much tokensa user has
   * @param addr The address of the developer
   */
  function balanceOf(address addr) public view returns (uint256) {
    return sacToken.balanceOf(addr);
  }

  function withdraw(
    address receiver,
    int256 totalScores,
    int256 producerScore,
    uint256 currentEra
  ) public mustBeAllowedCaller {
    require(canApprove(currentEra), "You can't approve yet");
    uint256 numTokens = tokens(totalScores, producerScore);
    require(numTokens > 0, "Don't have tokens to withdraw");

    sacToken.transferWith(address(this), receiver, numTokens);
  }

  function tokensPerEra() public view returns (uint256) {
    return tokensPerEpoch().div(totalEras);
  }

  function tokensPerEpoch() public view returns (uint256) {
    return tokensPerEpochs[currentEpoch() - 1];
  }

  function currentEpoch() public view returns (uint256) {
    return currentContractEra().div(halving) + 1;
  }

  function tokens(int256 totalScores, int256 producerScore) internal view returns (uint256) {
    if (!scoresToApprove(totalScores, producerScore)) return 0;
    return uint256(producerScore).mul((tokensPerEra().div(uint256(totalScores))));
  }

  function scoresToApprove(int256 totalScores, int256 producerScore) internal pure returns (bool) {
    return totalScores > 0 && producerScore > 0;
  }
}
