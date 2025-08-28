// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Callable
 * @author Sintrop
 * @notice Base contract to restrict access to certain functions, allowing calls only from a list of authorized addresses (allowedCallers).
 * @dev Inherit from this contract and use the `mustBeAllowedCaller` modifier to protect functions.
 * The list of allowed callers is managed by the contract owner (from Ownable).
 * If ownership is renounced, only previously added allowed callers will be able to call the functions.
 */
contract Callable is Ownable {
  // --- State variables ---

  /// @dev Mapping storing the addresses authorized to call protected functions.
  /// `true` if the address is allowed, `false` otherwise.
  mapping(address => bool) public allowedCallers;

  // --- Constructor ---

  /**
   * @dev Initializes the contract, setting the deployer as the initial owner.
   */
  constructor() Ownable(msg.sender) {
    // The constructor body is empty. Its only job is to call the parent Ownable constructor.
  }
  // --- Public functions ---

  /**
   * @dev Allows the contract owner to add a new address to the list of allowed callers.
   * If ownership is renounced, this function can no longer be performed.
   * @param allowed The address to add to the allowed callers list.
   */
  function newAllowedCaller(address allowed) public onlyOwner {
    allowedCallers[allowed] = true;
  }

  /**
   * @notice Checks if a given address is currently in the list of allowed callers.
   * @param caller The address to check.
   * @return bool True if the address is an allowed caller, false otherwise.
   */
  function isAllowedCaller(address caller) public view returns (bool) {
    return allowedCallers[caller];
  }

  // --- Modifiers ---

  /**
   * @dev Modifier to ensure that the function caller (`msg.sender`) is in the `allowedCallers` list.
   * @notice Reverts if `msg.sender` is not an allowed caller.
   */
  modifier mustBeAllowedCaller() {
    require(allowedCallers[msg.sender], "Not allowed caller");
    _;
  }

  /**
   * @dev Modifier to ensure that the function caller (`msg.sender`) is in the `addr`.
   * It is used to only allow calls from a specific contract address.
   * @notice Reverts if `msg.sender` is not addr.
   */
  modifier mustBeContractCall(address addr) {
    require(msg.sender == addr, "Caller must be system contract");
    _;
  }
}
