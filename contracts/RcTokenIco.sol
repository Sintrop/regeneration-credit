// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RcToken } from "./RcToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RcTokenIco is Ownable {
  using SafeMath for uint256;

  uint8 public constant DECIMALS = 18;
  uint256 public constant RATE = 80000;
  uint256 public constant MAXIMUM_EXCHANGE = 80000 * 100;

  RcToken internal rcToken;

  uint256 internal immutable DEPLOYED_AT = block.number;

  // ATTENTION: Update before deploy
  uint256 internal immutable ICO_START_BLOCK = 100;
  uint256 internal immutable ICO_END_BLOCK = 10000;

  event BuyTokensEvent(address indexed _buyer, uint256 _totalWei, uint256 _totalRcTokens, bool _transferStatus);

  receive() external payable {
    require(icoStart(), "ICO: sales is not open yet");
    require(icoEnd(), "ICO: sales is not open anymore");

    uint256 rcTokens = rcTokenAmount(msg.value);

    bool response = rcToken.transfer(msg.sender, rcTokens);

    emit BuyTokensEvent(msg.sender, msg.value, rcTokens, response);
  }

  function balance() public view returns (uint256) {
    return address(this).balance;
  }

  function icoStart() internal view returns (bool) {
    uint256 startsAt = DEPLOYED_AT + ICO_START_BLOCK;

    return block.number > startsAt;
  }

  function icoEnd() internal view returns (bool) {
    uint256 expiresAt = DEPLOYED_AT + ICO_END_BLOCK;

    return expiresAt > block.number;
  }

  function withdraw(uint256 weiAmount) public onlyOwner returns (bool success) {
    require(weiAmount <= address(this).balance, "ICO: insufficient balance");

    payable(_msgSender()).transfer(weiAmount);
    return true;
  }

  function withdrawRcToken(uint256 rcAmount) public onlyOwner returns (bool success) {
    rcToken.transfer(_msgSender(), rcAmount);
    return true;
  }

  function rcTokenAmount(uint256 weiAmount) internal pure returns (uint256) {
    return weiAmount.mul(RATE);
  }

  function setRcToken(address _tokenAddr) public onlyOwner {
    rcToken = RcToken(_tokenAddr);
  }
}
