// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegenerationCredit } from "./RegenerationCredit.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RegenerationCreditIco is Ownable {
  using SafeMath for uint256;

  uint8 public constant DECIMALS = 18;
  uint256 public constant RATE = 240000;
  uint256 public constant MAXIMUM_EXCHANGE = 240000 * 100;

  bool public salesOpen = false;

  RegenerationCredit internal regenerationCredit;

  event BuyTokensEvent(address indexed _buyer, uint256 _totalWei, uint256 _totalRegenerationCredits, bool _transferStatus);

  receive() external payable {
    require(salesOpen, "ICO: sales not open");

    uint256 regenerationCredits = regenerationCreditAmount(msg.value);

    bool response = regenerationCredit.transfer(msg.sender, regenerationCredits);

    emit BuyTokensEvent(msg.sender, msg.value, regenerationCredits, response);
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

  function withdrawRegenerationCredit(uint256 rcAmount) public onlyOwner returns (bool success) {
    regenerationCredit.transfer(_msgSender(), rcAmount);
    return true;
  }

  function regenerationCreditAmount(uint256 weiAmount) internal pure returns (uint256) {
    return weiAmount.mul(RATE);
  }

  function setRegenerationCredit(address _tokenAddr) public onlyOwner {
    regenerationCredit = RegenerationCredit(_tokenAddr);
  }
}
