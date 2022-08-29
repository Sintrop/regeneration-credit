// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SintropInterface.sol";
import "./SacTokenInterface.sol";

contract ProducerPool {
  SacTokenInterface internal sacToken;
  SintropInterface internal sintrop;

  constructor(address sacTokenAddress, address sintropAddress) {
    sacToken = SacTokenInterface(sacTokenAddress);
    sintrop = SintropInterface(sintropAddress);
  }

  function approve() public {
    uint256 numTokens = sintrop.getProducerApprove(msg.sender);

    sacToken.approveWith(msg.sender, numTokens);
  }

  function withDraw() public returns (bool) {
    sacToken.transferFrom(address(this), msg.sender, allowance());
    return true;
  }

  function allowance() public view returns (uint256) {
    return sacToken.allowance(address(this), msg.sender);
  }
}
