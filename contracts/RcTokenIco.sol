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

  RcToken internal token;

  event BuyTokensEvent(address indexed _buyer, uint256 _totalWei, uint256 _totalRcTokens, bool _transferStatus);

  receive() external payable {
    require(salesOpen, "ICO: sales not open");

    uint256 rcTokens = rcTokenAmount(msg.value);

    bool response = token.transfer(msg.sender, rcTokens);

    emit BuyTokensEvent(msg.sender, msg.value, rcTokens, response);
  }

  function balance() public view returns (uint256) {
    return address(this).balance;
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

  function withdrawTokens(uint256 rcAmount) public onlyOwner returns (bool success) {
    //uint256 tokenBalance = IERC20(token).balanceOf(address(this));
    uint256 tokenBalance = token.balanceOf(address(this));
    require(rcAmount <= tokenBalance, "ICO: insufficient balance");

    token.transfer(_msgSender(), rcAmount);
    return true;
  }

  function rcTokenAmount(uint256 weiAmount) internal pure returns (uint256) {
    return weiAmount.mul(RATE);
  }

  function setRcToken(address _tokenAddr) public onlyOwner {
    token = RcToken(_tokenAddr);
  }
}
