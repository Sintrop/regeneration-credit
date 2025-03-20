// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @author Sintrop
 * @title Callable
 * @dev Contract to secure public functions to be called only by allowedCallers
 */
contract Callable is Ownable {

  /// @dev Addresses allowed to call.   
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
