// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter, Publication, Offset } from "./types/SupporterTypes.sol";
import { UserType, Invitation } from "./types/CommunityTypes.sol";
import { SupporterPool } from "./SupporterPool.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SupporterRules
 * @author Sintrop
 * @notice Manages the rules and data specific to Supporter users within the community.
 * @dev This contract handles supporter registration, profile updates, token burning for environmental offsets and content publications, and management of reduction commitments.
 */
contract SupporterRules {
  using SafeMath for uint256;

  // --- State Variables ---

  /// @notice The relationship between address and supporter data
  mapping(address => Supporter) internal supporters;

  /// @notice The relationship between address and burned tokens per calculator item.
  mapping(address => mapping(uint64 => uint256)) public calculatorItemCertificates;

  /// @notice The relationship between address and reduction commitment statements (stored as calculator item IDs).
  mapping(address => uint64[]) public reductionCommitments;

  /// @notice The relationship between ID and supporter address.
  mapping(uint256 => address) public supportersAddress;

  /// @notice Commission percentage paid to the inviter when an invited supporter burns tokens.
  uint8 public constant INVITER_PERCENTAGE = 5; // 5%

  /// @notice Total number of offsets made across all supporters.
  uint64 public offsetsCount;

  /// @notice Total number of publications made across all supporters.
  uint64 public publicationsCount;

  /// @notice The relationship between id and publication data.
  mapping(uint64 => Publication) public publications;

  /// @notice The relationship between offset id and its data.
  mapping(uint64 => Offset) public offsets;

  /// @notice Max characters length allowed for a publication's description and content.
  uint256 constant MAX_CHARACTERS = 600;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice SupporterPool contract address
  SupporterPool internal supporterPool;

  /// @notice ResearcherRules contract address
  ResearcherRules internal researcherRules;

  /// @notice Supporter UserType
  UserType private constant USER_TYPE = UserType.SUPPORTER;

  // --- Constructor ---

  /**
   * @dev Initializes the SupporterRules contract with addresses of crucial external contracts.
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param supporterPoolAddress Address of the SupporterPool contract, used for token burning.
   * @param researcherRulesAddress Address of the ResearcherRules contract, used for CalculatorItem data.
   */

  constructor(address communityRulesAddress, address supporterPoolAddress, address researcherRulesAddress) {
    communityRules = CommunityRules(communityRulesAddress);
    supporterPool = SupporterPool(supporterPoolAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
  }

  // --- External Functions (State Modifying) ---

  /**
   * @notice Allow new register of supporter
   * @param name The name of the supporter
   */
  /**
   * @notice Allows a new user to register as a Supporter.
   * @dev Registers the sender as a Supporter, assigning them a unique ID and updating CommunityRules.
   * Requires name and profile photo length to be within limits.
   * @param name The name of the supporter (max 100 characters).
   * @param profilePhoto The profile photo URL/hash of the supporter (max 100 characters).
   */
  function addSupporter(string memory name, string memory description, string memory profilePhoto) public {
    require(
      bytes(name).length <= 50 && bytes(description).length <= 200 && bytes(profilePhoto).length <= 100,
      "Max characters reached"
    );

    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Supporter memory supporter = Supporter(id, msg.sender, name, description, profilePhoto, 0, 0, 0, block.number);

    supporters[msg.sender] = supporter;
    supportersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);

    emit SupporterRegistered(msg.sender, id, name, profilePhoto, block.number);
  }

  /**
   * @notice Allows a supporter to update their profile photo.
   * @dev Updates the 'profilePhoto' field for the calling supporter.
   * Only accessible by registered supporters, and enforces a max character limit.
   * @param newPhoto User's new profile photo URL/hash (max 100 characters).
   */
  function updateProfilePhoto(string memory newPhoto) public {
    require(bytes(newPhoto).length <= 100, "Max 100 characters");
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    Supporter storage supporter = supporters[msg.sender];

    supporter.profilePhoto = newPhoto;
  }

  /**
   * @notice Allows a supporter to burn tokens to compensate for a specific item's degradation.
   * @dev Burns tokens via the SupporterPool. If a valid calculatorItemId is provided,
   * records the burned amount as a certificate for that item.
   * @param amount Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param calculatorItemId The ID of the CalculatorItem, or 0 if not applicable.
   */
  function offset(uint256 amount, uint64 calculatorItemId) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount >= 1000000000000000000, "Amount invalid");

    uint256 amountBurn = burnTokens(amount); // This calculates commission and calls SupporterPool

    uint64 id = offsetsCount + 1;

    if (calculatorItemId > 0) {
      CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);
      if (calculatorItem.id > 0) calculatorItemCertificates[msg.sender][calculatorItemId] += amountBurn;
    }

    Supporter storage supporter = supporters[msg.sender];

    offsets[id] = Offset(msg.sender, block.number, amountBurn, calculatorItemId);

    offsetsCount = offsetsCount + 1;
    supporter.offsetsCount++;

    emit OffsetMade(msg.sender, id, amountBurn, calculatorItemId, block.number);
  }

  /**
   * @notice Allows a supporter to burn tokens to post content.
   * @dev Burns tokens via the SupporterPool and creates a new publication record.
   * Enforces character limits for description and content.
   * @param amount Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param description The description of the post (max 600 characters).
   * @param content The content of the post (max 600 characters).
   */
  function publish(uint256 amount, string memory description, string memory content) public {
    require(
      bytes(description).length <= MAX_CHARACTERS && bytes(content).length <= MAX_CHARACTERS,
      "Max 600 characters"
    );
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount >= 1000000000000000000, "Amount invalid");

    uint256 amountBurn = burnTokens(amount); // This calculates commission and calls SupporterPool

    uint64 id = publicationsCount + 1;

    publications[id] = Publication(msg.sender, block.number, amountBurn, description, content);

    Supporter storage supporter = supporters[msg.sender];

    publicationsCount = publicationsCount + 1;
    supporter.publicationsCount++;

    emit PublicationPosted(msg.sender, id, amountBurn, description, block.number);
  }

  /**
   * @notice Allows a supporter to declare a reduction commitment for a specific calculator item.
   * @dev Records the calculator item ID as a commitment for the calling supporter.
   * Requires the calculator item to exist and the sender to be a registered supporter.
   * @param calculatorItemId The ID of the CalculatorItem for which the commitment is being declared.
   */
  function declareReductionCommitment(uint64 calculatorItemId) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);

    require(calculatorItem.id > 0, "Calculator item does not exist");

    Supporter storage supporter = supporters[msg.sender];

    reductionCommitments[msg.sender].push(calculatorItemId);
    supporter.reductionItemsCount++;

    emit ReductionCommitmentDeclared(msg.sender, calculatorItemId, block.number);
  }

  // --- Internal Functions (State Modifying) ---

  /**
   * @dev Internal function to handle token burning and inviter commission.
   * It retrieves invitation data from CommunityRules and calls the SupporterPool to perform the burn.
   * @param amount The total amount of tokens to consider for burning (before commission).
   * @return uint256 The net amount of tokens burned by the supporter (after commission).
   */
  function burnTokens(uint256 amount) internal returns (uint256) {
    Invitation memory invitation = communityRules.getInvitation(msg.sender);
    bool isInvited = invitation.createdAtBlock != 0; // Check if invitation exists

    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    uint256 amountBurn = amount.sub(inviterTotalTokens);

    supporterPool.burnTokens(msg.sender, invitation.inviter, amountBurn, inviterTotalTokens);

    return amountBurn;
  }

  // --- View Functions ---

  /**
   * @notice Retrieves the list of reduction commitment item IDs for a specific address.
   * @param addr The address of the supporter.
   * @return uint256[] An array of calculator item IDs representing the commitments.
   */
  function getReductionCommitments(address addr) public view returns (uint64[] memory) {
    return reductionCommitments[addr];
  }

  /**
   * @dev Retrieves the full Supporter struct data for a specific address.
   * @notice Returns the detailed information of a supporter.
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
    uint256 blockNumber
  );

  /**
   * @notice Emitted when a supporter burns tokens to publish content.
   * @param publisherAddress The address of the supporter.
   * @param publicationId The unique ID of the publication record.
   * @param amountBurned The amount of tokens burned by the supporter for the publication.
   * @param description The description of the publication.
   * @param blockNumber The block number at which the publication occurred.
   */
  event PublicationPosted(
    address indexed publisherAddress,
    uint256 publicationId,
    uint256 amountBurned,
    string description,
    uint256 blockNumber
  );

  /**
   * @notice Emitted when a supporter declares a reduction commitment.
   * @param supporterAddress The address of the supporter.
   * @param calculatorItemId The ID of the calculator item for the commitment.
   * @param blockNumber The block number at which the commitment was declared.
   */
  event ReductionCommitmentDeclared(address indexed supporterAddress, uint256 calculatorItemId, uint256 blockNumber);
}
