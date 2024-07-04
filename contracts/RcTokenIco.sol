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

  bool public salesOpen = false;

  RcToken internal rcToken;

  uint256 icoEnds;

  event BuyTokensEvent(address indexed _buyer, uint256 _totalWei, uint256 _totalRcTokens, bool _transferStatus);

  receive() external payable {
    require(salesOpen, "ICO: sales is not open");
    require(icoTime(), "ICO: sales is not open anymore");

    uint256 rcTokens = rcTokenAmount(msg.value);

    bool response = rcToken.transfer(msg.sender, rcTokens);

    emit BuyTokensEvent(msg.sender, msg.value, rcTokens, response);
  }

  function balance() public view returns (uint256) {
    return address(this).balance;
  }

  function icoTime() internal view returns (bool) {
    uint256 expiresAt = rcToken.deployedAt() + icoEnds;
    
    if (expiresAt > block.number) return true;
  }

  function changeSalesOpen() public onlyOwner returns (bool success) {
    salesOpen = !salesOpen;
    return true;
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
