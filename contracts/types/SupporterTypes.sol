// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

/**
 * @dev Supporter user type data structure
 * @param id User id
 * @param supporterWallet Supporter wallet address
 * @param name User name
 * @param createdAt Block of user creation
 */
struct Supporter {
  uint256 id;
  address supporterWallet;
  string name;
  uint256 createdAt;
}

/**
 * @dev Publication data structure
 * @param supporterAddress Supporter wallet address
 * @param createdAt Block of creation
 * @param amount Tokens burned
 * @param description Publication description
 * @param content Publication content
 */
struct Publication {
  address supporterAddress;
  uint256 createdAt;
  uint256 amount;
  string description;
  string content;
}

struct Offset {
  address supporterAddress;
  uint256 createdAt;
  uint256 amountBurn;
  uint256 calculatorItemId;
}

/**
 * @dev PublicationId data structure
 */
struct PublicationId {
  uint256 id;
}

/**
 * @dev OffsetId data structure
 */
struct OffsetId {
  uint256 id;
}
