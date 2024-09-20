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

  uint256 internal immutable DEPLOYED_AT = block.number;
  uint256 internal immutable ICO_STARTS_AT;
  uint256 internal immutable ICO_ENDS_AT;

  constructor(uint256 icoStartsAt_, uint256 icoEndsAt_) {
    ICO_STARTS_AT = icoStartsAt_;
    ICO_ENDS_AT = icoEndsAt_;
  }

  event BuyTokensEvent(
    address indexed _buyer,
    uint256 _totalWei,
    uint256 _totalRegenerationCredits,
    bool _transferStatus
  );

  receive() external payable {
    require(icoStart(), "ICO: sales is not open yet");
    require(icoEnd(), "ICO: sales is not open anymore");

    uint256 regenerationCredits = regenerationCreditAmount(msg.value);

    bool response = regenerationCredit.transfer(msg.sender, regenerationCredits);

    emit BuyTokensEvent(msg.sender, msg.value, regenerationCredits, response);
  }

  function balance() public view returns (uint256) {
    return address(this).balance;
  }

  function icoStart() internal view returns (bool) {
    return block.number > DEPLOYED_AT + ICO_STARTS_AT;
  }

  function icoEnd() internal view returns (bool) {
    return DEPLOYED_AT + ICO_ENDS_AT > block.number;
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
