// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { Offer } from "./types/MarketTypes.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RegenerationCreditMarket
 * @author Sintrop
 * @notice Peer-to-peer marketplace for Regeneration Credits without custody.
 * @dev Registered users publish sale offers declaring amount, unit price and payment method.
 * Payment happens off-chain. When the seller confirms the sale, this contract transfers the
 * tokens directly from the seller to the buyer using the seller's allowance, so every
 * completed sale corresponds to a real on-chain transfer. Tokens are never held by this contract.
 *
 * All offer data is public and permanent on the blockchain. Payment methods must contain only
 * information meant to be public (ex: a random Pix key), never personal documents.
 */
contract RegenerationCreditMarket is ReentrancyGuard {
  // --- Constants ---

  /// @notice Max length in bytes for the offer description.
  uint256 public constant MAX_DESCRIPTION_LENGTH = 500;

  /// @notice Max length in bytes for the payment method.
  uint256 public constant MAX_PAYMENT_METHOD_LENGTH = 200;

  /// @notice Max length in bytes for the unit price.
  uint256 public constant MAX_PRICE_LENGTH = 50;

  /// @notice The minimum amount of tokens per offer (1 RC).
  uint256 public constant MINIMUM_AMOUNT = 1e18;

  // --- State variables ---

  /// @notice RegenerationCredit contract interface.
  IRegenerationCredit public regenerationCredit;

  /// @notice CommunityRules contract interface.
  ICommunityRules public communityRules;

  /// @notice Total number of offers created.
  uint256 private _offersCount;

  /// @notice The relationship between offer id and its data.
  mapping(uint256 => Offer) public offers;

  /// @notice The relationship between seller address and its offer ids.
  mapping(address => uint256[]) public sellerOfferIds;

  /// @notice The relationship between seller address and its number of confirmed sales.
  mapping(address => uint256) public sellerSalesCount;

  // --- Events ---

  /**
   * @dev Emitted when a new offer is created.
   * @param offerId Unique identifier of the offer.
   * @param seller Address of the seller.
   * @param amountRC Amount of tokens for sale.
   * @param unitPrice Unit price for the tokens.
   */
  event OfferCreated(uint256 indexed offerId, address indexed seller, uint256 amountRC, string unitPrice);

  /**
   * @dev Emitted when an offer is cancelled.
   * @param offerId Unique identifier of the cancelled offer.
   * @param seller Address of the seller who cancelled.
   */
  event OfferCancelled(uint256 indexed offerId, address indexed seller);

  /**
   * @dev Emitted when a sale is confirmed and the tokens are transferred.
   * @param offerId Unique identifier of the completed offer.
   * @param seller Address of the seller.
   * @param buyer Address of the buyer.
   * @param amountRC Amount of tokens transferred.
   */
  event OfferCompleted(uint256 indexed offerId, address indexed seller, address indexed buyer, uint256 amountRC);

  // --- Errors ---

  error InvalidAmount();
  error InvalidPrice();
  error InvalidPaymentMethod();
  error InvalidDescription();
  error OfferNotActive(uint256 offerId);
  error NotSeller(uint256 offerId);
  error InsufficientBalance(uint256 required, uint256 available);
  error InsufficientAllowance(uint256 required, uint256 available);
  error ZeroAddress();
  error InvalidBuyer();
  error OfferNotFound(uint256 offerId);
  error NotRegistered();
  error UserDenied();
  error TransferFailed();

  // --- Constructor ---

  /**
   * @dev Initializes the contract with the token and community contracts.
   * @param regenerationCreditAddress Address of the RegenerationCredit contract.
   * @param communityRulesAddress Address of the CommunityRules contract.
   */
  constructor(address regenerationCreditAddress, address communityRulesAddress) ReentrancyGuard() {
    if (regenerationCreditAddress == address(0) || communityRulesAddress == address(0)) revert ZeroAddress();
    regenerationCredit = IRegenerationCredit(regenerationCreditAddress);
    communityRules = ICommunityRules(communityRulesAddress);
  }

  // --- External functions ---

  /**
   * @notice Creates a new offer for selling Regeneration Credits.
   * @dev The seller must be a registered, non-denied user and must hold and approve to this
   * contract at least `amountRC` tokens, so the offer can be confirmed later.
   * @param amountRC Amount of tokens to sell, with 18 decimals (minimum 1 RC = 1e18).
   * @param unitPrice Price per unit (max 50 bytes).
   * @param paymentMethod Public payment instructions (max 200 bytes).
   * @param description Description of the offer (max 500 bytes).
   * @return offerId The unique ID of the created offer.
   */
  function createOffer(
    uint256 amountRC,
    string calldata unitPrice,
    string calldata paymentMethod,
    string calldata description
  ) external returns (uint256) {
    _requireActiveUser(msg.sender);

    if (amountRC < MINIMUM_AMOUNT) revert InvalidAmount();
    if (bytes(unitPrice).length == 0 || bytes(unitPrice).length > MAX_PRICE_LENGTH) revert InvalidPrice();
    if (bytes(paymentMethod).length == 0 || bytes(paymentMethod).length > MAX_PAYMENT_METHOD_LENGTH)
      revert InvalidPaymentMethod();
    if (bytes(description).length == 0 || bytes(description).length > MAX_DESCRIPTION_LENGTH)
      revert InvalidDescription();

    _requireFunds(msg.sender, amountRC);

    uint256 offerId = ++_offersCount;

    offers[offerId] = Offer({
      id: offerId,
      seller: msg.sender,
      amountRC: amountRC,
      unitPrice: unitPrice,
      paymentMethod: paymentMethod,
      description: description,
      active: true,
      createdAt: block.number,
      buyer: address(0),
      completedAt: 0
    });

    sellerOfferIds[msg.sender].push(offerId);

    emit OfferCreated(offerId, msg.sender, amountRC, unitPrice);

    return offerId;
  }

  /**
   * @notice Cancels an active offer.
   * @dev Only the seller can cancel. Denied sellers can still cancel their own offers.
   * @param offerId ID of the offer to cancel.
   */
  function cancelOffer(uint256 offerId) external {
    Offer storage offer = offers[offerId];

    if (!offer.active) revert OfferNotActive(offerId);
    if (offer.seller != msg.sender) revert NotSeller(offerId);

    offer.active = false;

    emit OfferCancelled(offerId, msg.sender);
  }

  /**
   * @notice Confirms a sale after the off-chain payment and transfers the tokens to the buyer.
   * @dev Only the seller can confirm. The tokens are moved from the seller to the buyer with
   * `transferFrom`, so the seller must keep the balance and the allowance until confirmation.
   * A seller denied after creating the offer can still confirm it, so a buyer who already paid receives the tokens.
   * @param offerId ID of the offer being completed.
   * @param buyer Address that receives the tokens.
   */
  function confirmSale(uint256 offerId, address buyer) external nonReentrant {
    if (buyer == address(0)) revert ZeroAddress();

    Offer storage offer = offers[offerId];

    if (!offer.active) revert OfferNotActive(offerId);
    if (offer.seller != msg.sender) revert NotSeller(offerId);
    if (buyer == msg.sender) revert InvalidBuyer();

    uint256 amount = offer.amountRC;
    _requireFunds(msg.sender, amount);

    offer.active = false;
    offer.buyer = buyer;
    offer.completedAt = block.number;

    sellerSalesCount[msg.sender]++;

    if (!regenerationCredit.transferFrom(msg.sender, buyer, amount)) revert TransferFailed();

    emit OfferCompleted(offerId, msg.sender, buyer, amount);
  }

  // --- View functions ---

  /**
   * @notice Returns the total number of offers created.
   * @return uint256 The number of offers.
   */
  function getOffersCount() external view returns (uint256) {
    return _offersCount;
  }

  /**
   * @notice Returns a specific offer by ID.
   * @param offerId ID of the offer to retrieve.
   * @return Offer The offer details.
   */
  function getOffer(uint256 offerId) external view returns (Offer memory) {
    if (offerId == 0 || offerId > _offersCount) revert OfferNotFound(offerId);
    return offers[offerId];
  }

  /**
   * @notice Returns all offer IDs for a specific seller.
   * @param seller Address of the seller.
   * @return uint256[] The offer IDs belonging to the seller.
   */
  function getSellerOfferIds(address seller) external view returns (uint256[] memory) {
    return sellerOfferIds[seller];
  }

  /**
   * @notice Returns the total number of confirmed sales for a seller.
   * @param seller Address of the seller.
   * @return uint256 The number of confirmed sales.
   */
  function getSellerSalesCount(address seller) external view returns (uint256) {
    return sellerSalesCount[seller];
  }

  // --- Private functions ---

  /**
   * @dev Reverts if the user is not registered in the community or has been denied.
   * @param user Address to check.
   */
  function _requireActiveUser(address user) private view {
    if (communityRules.getUser(user) == CommunityTypes.UserType.UNDEFINED) revert NotRegistered();
    if (communityRules.isDenied(user)) revert UserDenied();
  }

  /**
   * @dev Reverts if the seller does not hold or has not approved enough tokens to this contract.
   * @param seller Address of the seller.
   * @param amount Amount of tokens required.
   */
  function _requireFunds(address seller, uint256 amount) private view {
    uint256 balance = regenerationCredit.balanceOf(seller);
    if (balance < amount) revert InsufficientBalance(amount, balance);

    uint256 allowance = regenerationCredit.allowance(seller, address(this));
    if (allowance < amount) revert InsufficientAllowance(amount, allowance);
  }
}
