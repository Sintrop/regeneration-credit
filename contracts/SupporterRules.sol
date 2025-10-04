// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { ICommunityRules } from "./interfaces/ICommunityRules.sol";
import { IResearcherRules } from "./interfaces/IResearcherRules.sol";
import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter, Offset } from "./types/SupporterTypes.sol";
import { CommunityTypes } from "./types/CommunityTypes.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SupporterRules
 * @author Sintrop
 * @notice Manages the rules and data specific to Supporter users within the community.
 * @dev This contract handles supporter registration, profile updates, token burning
 * for environmental offsets and management of reduction commitments.
 */
contract SupporterRules is ReentrancyGuard {
  // --- Constants ---

  /// @notice Commission percentage paid to the inviter when an invited supporter burns tokens.
  uint8 public constant INVITER_PERCENTAGE = 5; // 5%

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Max character length for description text.
  uint16 private constant MAX_TEXT_LENGTH = 200;

  /// @notice Maximum character length for the message.
  uint16 private constant MAX_MESSAGE_LENGTH = 300;

  /// @notice The minimum number of tokens a user must burn to offset.
  uint256 private constant MINIMUM_TOKENS_TO_OFFSET = 1e18;

  /// @notice The maximum number of commitments for supporters.
  uint256 public constant MAX_COMMITMENTS = 1000;

  // --- State variables ---

  /// @notice The relationship between address and supporter data.
  mapping(address => Supporter) private supporters;

  /// @notice The relationship between address and burned tokens per calculator item.
  mapping(address => mapping(uint64 => uint256)) public calculatorItemCertificates;

  /// @notice The relationship between address and reduction commitment statements (stored as calculator item IDs).
  mapping(address => uint64[]) public reductionCommitments;

  /// @notice The relationship between an address and a mapping of items ids and booleans if declared commitment or not.
  mapping(address => mapping(uint256 => bool)) public declaredReduction;

  /// @notice The relationship between ID and supporter address.
  mapping(uint256 => address) public supportersAddress;

  /// @notice Total number of offsets made across all supporters.
  uint64 public offsetsCount;

  /// @notice The relationship between offset id and its data.
  mapping(uint64 => Offset) public offsets;

  /// @notice CommunityRules contract interface.
  ICommunityRules public communityRules;

  /// @notice ResearcherRules contract interface.
  IResearcherRules public researcherRules;

  /// @notice RegenerationCredit contract interface.
  IRegenerationCredit public regenerationCredit;

  /// @notice Supporter UserType.
  CommunityTypes.UserType private constant USER_TYPE = CommunityTypes.UserType.SUPPORTER;

  // --- Constructor ---

  /**
   * @dev Initializes the SupporterRules contract with addresses of crucial external contracts.
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract, used for CalculatorItem data.
   */

  constructor(
    address communityRulesAddress,
    address researcherRulesAddress,
    address regenerationCreditAddress
  ) ReentrancyGuard() {
    communityRules = ICommunityRules(communityRulesAddress);
    researcherRules = IResearcherRules(researcherRulesAddress);
    regenerationCredit = IRegenerationCredit(regenerationCreditAddress);
  }

  // --- Public functions (State Modifying) ---

  /**
   * @notice Allows a new user to register as a Supporter.
   * @dev Registers the sender as a Supporter, assigning them a unique ID and updating CommunityRules.
   * Requires name and profile photo length to be within limits.
   * @param name The name of the supporter (max 100 characters).
   * @param description Brief description of the the supporter (max 200 characters).
   * @param profilePhoto The profile photo URL/hash of the supporter (max 150 characters).
   */
  function addSupporter(string memory name, string memory description, string memory profilePhoto) external {
    require(
      bytes(name).length <= MAX_NAME_LENGTH &&
        bytes(description).length <= MAX_TEXT_LENGTH &&
        bytes(profilePhoto).length <= MAX_HASH_LENGTH,
      "Max characters reached"
    );

    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    supporters[msg.sender] = Supporter(id, msg.sender, name, description, profilePhoto, 0, 0, block.number);
    supportersAddress[id] = msg.sender;

    communityRules.addUser(msg.sender, USER_TYPE);

    emit SupporterRegistered(msg.sender, id, name, profilePhoto, block.number);
  }

  /**
   * @notice Allows a supporter to update their profile photo.
   * @dev Updates the 'profilePhoto' field for the calling supporter.
   * Only accessible by registered supporters, and enforces a max character limit.
   * @param newPhoto User's new profile photo URL/hash (max 150 characters).
   */
  function updateProfilePhoto(string memory newPhoto) external {
    require(bytes(newPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    require(communityRules.userTypeIs(CommunityTypes.UserType.SUPPORTER, msg.sender), "Only supporters");

    supporters[msg.sender].profilePhoto = newPhoto;
  }

  /**
   *
   * @notice Allows a supporter to burn tokens to compensate for a specific item's degradation, with a message to the community.
   * Before calling this function, supporters must approve the SupporterRules contract to burn the required amount oftokens.
   * @dev This function calls the token transfer function to pay comissions and burnFrom to trade tokens
   * for the compensation certificate. If a valid calculatorItemId is provided,
   * records the burned amount as a certificate for that item.
   * @param amount Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param minAmountToBurn Slippage protection: the minimum amount the user expects to burn after commission.
   * @param calculatorItemId The ID of the CalculatorItem, or 0 if not applicable.
   * @param message A message to the community.
   */
  function offset(
    uint256 amount,
    uint256 minAmountToBurn,
    uint64 calculatorItemId,
    string memory message
  ) external nonReentrant {
    require(researcherRules.getCalculatorItem(calculatorItemId).id > 0, "Calculator item does not exist");
    require(communityRules.userTypeIs(CommunityTypes.UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount >= MINIMUM_TOKENS_TO_OFFSET, "Amount must be at least 1 RC");
    require(bytes(message).length <= MAX_MESSAGE_LENGTH, "Max characters");

    (uint256 amountToBurn, uint256 commission, address inviter) = calculateCommission(msg.sender, amount);
    require(amountToBurn >= minAmountToBurn, "Slippage: amount to burn is less than minimum");

    offsetsCount++;
    uint64 id = offsetsCount;

    calculatorItemCertificates[msg.sender][calculatorItemId] += amountToBurn;

    offsets[id] = Offset(msg.sender, block.number, amountToBurn, calculatorItemId, message);
    supporters[msg.sender].offsetsCount++;

    if (commission > 0 && inviter != address(0)) {
      regenerationCredit.transferFrom(msg.sender, inviter, commission);
      emit CommissionsPaid(msg.sender, inviter, commission);
    }
    regenerationCredit.burnFrom(msg.sender, amountToBurn);

    emit OffsetMade(msg.sender, id, amountToBurn, calculatorItemId, block.number, message);
  }

  /**
   * @notice Allows a supporter to declare a reduction commitment for a specific calculator item.
   * @dev Records the calculator item ID as a commitment for the calling supporter.
   * Requires the calculator item to exist and the sender to be a registered supporter.
   * @param calculatorItemId The ID of the CalculatorItem for which the commitment is being declared.
   */
  function declareReductionCommitment(uint64 calculatorItemId) external {
    require(communityRules.userTypeIs(CommunityTypes.UserType.SUPPORTER, msg.sender), "Only supporters");
    require(!declaredReduction[msg.sender][calculatorItemId], "Commitment already declared");
    require(supporters[msg.sender].reductionItemsCount < MAX_COMMITMENTS, "Max commitments reached");

    CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);

    require(calculatorItem.id > 0, "Calculator item does not exist");

    reductionCommitments[msg.sender].push(calculatorItemId);
    declaredReduction[msg.sender][calculatorItemId] = true;
    supporters[msg.sender].reductionItemsCount++;

    emit ReductionCommitmentDeclared(msg.sender, calculatorItemId, block.number);
  }

  // --- View Functions ---

  /**
   * @notice This functions calculates the comission to be sent to the supporter inviter.
   * @dev Public function to handle tokens to be burned and inviter commission.
   * It retrieves invitation data from CommunityRules to perform the burn.
   * @param amount The total amount of tokens to consider for burning (before commission).
   * @return amountToBurn The net amount of tokens burned by the supporter (after commission).
   * @return commission The commission for the invitation service provided.
   * @return inviter The supporter inviter.
   */
  function calculateCommission(
    address supporterAddress,
    uint256 amount
  ) private view returns (uint256 amountToBurn, uint256 commission, address inviter) {
    CommunityTypes.Invitation memory invitation = communityRules.getInvitation(supporterAddress);
    bool isInvited = invitation.createdAtBlock != 0; // Check if invitation exists

    inviter = invitation.inviter;

    commission = isInvited ? (amount * INVITER_PERCENTAGE) / 100 : 0;
    amountToBurn = amount - commission;
  }

  /**
   * @notice Retrieves the list of reduction commitment item IDs for a specific address.
   * @param addr The address of the supporter.
   * @return uint256[] An array of calculator item IDs representing the commitments.
   */
  function getReductionCommitments(address addr) public view returns (uint64[] memory) {
    return reductionCommitments[addr];
  }

  /**
   * @notice Returns the detailed information of a supporter.
   * @dev Retrieves the full Supporter struct data for a specific address.
   * @param addr The address of the supporter.
   * @return Supporter The `Supporter` struct containing their data.
   */
  function getSupporter(address addr) public view returns (Supporter memory) {
    return supporters[addr];
  }

  // --- Events ---

  /**
   * @notice Emitted when a new supporter is registered.
   * @param supporterAddress The address of the newly registered supporter.
   * @param supporterId The unique ID assigned to the supporter.
   * @param name The name of the supporter.
   * @param profilePhoto The URL or hash of the supporter's profile photo.
   * @param createdAtBlock The block number at which the supporter was registered.
   */
  event SupporterRegistered(
    address indexed supporterAddress,
    uint256 supporterId,
    string name,
    string profilePhoto,
    uint256 createdAtBlock
  );

  /**
   * @notice Emitted when a supporter burns tokens to offset degradation.
   * @param supporterAddress The address of the supporter.
   * @param offsetId The unique ID of the offset record.
   * @param amountBurned The amount of tokens burned by the supporter for the offset.
   * @param calculatorItemId The ID of the calculator item, if associated.
   * @param blockNumber The block number at which the offset occurred.
   */
  event OffsetMade(
    address indexed supporterAddress,
    uint256 offsetId,
    uint256 amountBurned,
    uint256 calculatorItemId,
    uint256 blockNumber,
    string message
  );

  /**
   * @notice Emitted when a supporter declares a reduction commitment.
   * @param supporterAddress The address of the supporter.
   * @param calculatorItemId The ID of the calculator item for the commitment.
   * @param blockNumber The block number at which the commitment was declared.
   */
  event ReductionCommitmentDeclared(
    address indexed supporterAddress,
    uint256 indexed calculatorItemId,
    uint256 blockNumber
  );

  /**
   * @dev Emitted when a supporter offset results in a commission payment to the inviter.
   * @param supporter The address of the supporter who paid the commission.
   * @param inviter The address of the inviter who received the commission.
   * @param amount The commission amount paid.
   */
  event CommissionsPaid(address indexed supporter, address indexed inviter, uint256 amount);
}
