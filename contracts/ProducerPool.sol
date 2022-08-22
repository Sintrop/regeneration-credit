// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SintropInterface.sol";
import "./SacTokenInterface.sol";

contract ProducerPool is PoolInterface {
  SacTokenInterface sacToken;
  SintropInterface sintrop;

  constructor(address sacTokenAddress, address sintropAddress) {
    sacToken = SacTokenInterface(sacTokenAddress);
    sintrop = SintropInterface(sintropAddress);
  }

  function approve(
    address delegate,
    uint256 level,
    uint256 currentEra
  ) public override {
    uint256 numTokens = sintrop.getProducerApprove(msg.sender);

    sacToken.approveWith(msg.sender, numTokens);
  }

  function withDraw() public override returns (bool) {
    sacToken.transferFrom(address(this), msg.sender, allowance());
    return true;
  }

  function allowance() public view override returns (uint256) {
    return sacToken.allowance(address(this), msg.sender);
  }
}
