// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Supporter user type data structure.
 * @param id User id.
 * @param supporterWallet Supporter wallet address.
 * @param name User name.
 * @param description Brief user description or purpose.
 * @param profilePhoto User profilePhoto hash or content unique identifier.
 * @param publicationsCount Count of publications.
 * @param offsetsCount Count of offsets.
 * @param reductionItemsCount Count of declared reduction commitments.
 * @param createdAt Block of user creation.
 */
struct Supporter {
  uint64 id;
  address supporterWallet;
  string name;
  string description;
  string profilePhoto;
  uint32 offsetsCount;
  uint16 reductionItemsCount;
  uint256 createdAt;
}

/**
 * @dev Offset data structure.
 * @param supporterAddress Supporter wallet address.
 * @param createdAt Block of creation.
 * @param amountBrun Tokens burned.
 * @param calculatorItemId Calculator item to offset.
 * @param message A message to the community.
 */
struct Offset {
  address supporterAddress;
  uint256 createdAt;
  uint256 amountBurn;
  uint256 calculatorItemId;
  string message;
}
