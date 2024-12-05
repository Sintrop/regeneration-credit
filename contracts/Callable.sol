// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Callable is Ownable {
  mapping(address => bool) public allowedCallers;

  /**
   * @dev Add a new allowed caller address
   * @param allowed Allowed caller address
   */
  function newAllowedCaller(address allowed) public onlyOwner {
    allowedCallers[allowed] = true;
  }

  /**
   * @dev Checks if an address is allowed caller
   * @param caller Address to check
   */
  function isAllowedCaller(address caller) public view returns (bool) {
    return allowedCallers[caller];
  }

  /**
   * @dev Only allow allowed callers to call function
   */
  modifier mustBeAllowedCaller() {
    require(allowedCallers[msg.sender], "Not allowed caller");
    _;
  }
}
