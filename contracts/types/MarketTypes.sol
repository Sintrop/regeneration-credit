// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Struct representing a peer-to-peer sale offer of Regeneration Credits.
 * @param id Unique identifier of the offer.
 * @param seller Address of the seller.
 * @param amountRC Amount of tokens for sale, with 18 decimals (1 RC = 1e18).
 * @param unitPrice Price per unit agreed off-chain (ex: "R$0,10" or "0.01 BTC").
 * @param paymentMethod Public payment instructions (ex: a random Pix key). Never personal documents.
 * @param description Offer description.
 * @param active True while the offer can be cancelled or confirmed.
 * @param createdAt Block number when the offer was created.
 * @param buyer Address that received the tokens when the sale was confirmed.
 * @param completedAt Block number when the sale was confirmed.
 */
struct Offer {
  uint256 id;
  address seller;
  uint256 amountRC;
  string unitPrice;
  string paymentMethod;
  string description;
  bool active;
  uint256 createdAt;
  address buyer;
  uint256 completedAt;
}
