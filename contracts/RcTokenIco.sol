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

  receive() external payable {
    require(salesOpen, "ICO: sales not open");

    token.transfer(msg.sender, rcTokenAmount(msg.value));
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

  function rcTokenAmount(uint256 weiAmount) internal pure returns (uint256) {
    return weiAmount.div(10 ** DECIMALS).mul(RATE);
  }

  function setRcToken(address _tokenAddr) public onlyOwner {
    token = RcToken(_tokenAddr);
  }
}
