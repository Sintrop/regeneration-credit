// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { Callable } from "./shared/Callable.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter, Publication, Offset } from "./types/SupporterTypes.sol";
import { UserType, Invitation } from "./types/CommunityTypes.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SupporterRules
 * @author Sintrop
 * @notice Manages the rules and data specific to Supporter users within the community.
 * @dev This contract handles supporter registration, profile updates, token burning
 * for environmental offsets and content publications, and management of reduction commitments.
 */
contract SupporterRules is Callable {
  using SafeMath for uint256;

  // --- Constants ---

  /// @notice Commission percentage paid to the inviter when an invited supporter burns tokens.
  uint8 public constant INVITER_PERCENTAGE = 5; // 5%

  /// @notice Max character length for user name.
  uint16 private constant MAX_NAME_LENGTH = 50;

  /// @notice Max character length for hash or url.
  uint16 private constant MAX_HASH_LENGTH = 150;

  /// @notice Max character length for text.
  uint16 private constant MAX_TEXT_LENGTH = 200;

  // --- State variables ---

  /// @notice The relationship between address and supporter data
  mapping(address => Supporter) internal supporters;

  /// @notice The relationship between address and burned tokens per calculator item.
  mapping(address => mapping(uint64 => uint256)) public calculatorItemCertificates;

  /// @notice The relationship between address and reduction commitment statements (stored as calculator item IDs).
  mapping(address => uint64[]) public reductionCommitments;

  /// @notice The
  mapping(address => mapping(uint256 => bool)) public declaredReduction;

  /// @notice The relationship between ID and supporter address.
  mapping(uint256 => address) public supportersAddress;

  /// @notice Total number of offsets made across all supporters.
  uint64 public offsetsCount;

  /// @notice Total number of publications made across all supporters.
  uint64 public publicationsCount;

  /// @notice The relationship between id and publication data.
  mapping(uint64 => Publication) public publications;

  /// @notice The relationship between offset id and its data.
  mapping(uint64 => Offset) public offsets;

  /// @notice CommunityRules contract address
  CommunityRules private communityRules;

  /// @notice ResearcherRules contract address
  ResearcherRules private researcherRules;

  /// @notice Supporter UserType
  UserType private constant USER_TYPE = UserType.SUPPORTER;

  // --- Constructor ---

  /**
   * @dev Initializes the SupporterRules contract with addresses of crucial external contracts.
   * @param communityRulesAddress Address of the CommunityRules contract.
   * @param researcherRulesAddress Address of the ResearcherRules contract, used for CalculatorItem data.
   */

  constructor(address communityRulesAddress, address researcherRulesAddress) {
    communityRules = CommunityRules(communityRulesAddress);
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
   * @param description Brief description of the the supporter (max 200 characters).
   * @param profilePhoto The profile photo URL/hash of the supporter (max 150 characters).
   */
  function addSupporter(string memory name, string memory description, string memory profilePhoto) public {
    require(
      bytes(name).length <= MAX_NAME_LENGTH &&
        bytes(description).length <= MAX_TEXT_LENGTH &&
        bytes(profilePhoto).length <= MAX_HASH_LENGTH,
      "Max characters reached"
    );

    uint64 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    supporters[msg.sender] = Supporter(id, msg.sender, name, description, profilePhoto, 0, 0, 0, block.number);
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
  function updateProfilePhoto(string memory newPhoto) public {
    require(bytes(newPhoto).length <= MAX_HASH_LENGTH, "Max characters");
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    supporters[msg.sender].profilePhoto = newPhoto;
  }

  /**
   * @dev Called by the RC offset function. If a valid calculatorItemId is provided,
   * records the burned amount as a certificate for that item.
   * @param supporterAddress address of supporter
   * @param amountToBurn Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param calculatorItemId The ID of the CalculatorItem, or 0 if not applicable.
   */
  function offset(
    address supporterAddress,
    uint256 amountToBurn,
    uint64 calculatorItemId
  ) external mustBeAllowedCaller {
    require(researcherRules.getCalculatorItem(calculatorItemId).id > 0, "Calculator item does not exist");

    offsetsCount++;
    uint64 id = offsetsCount;

    calculatorItemCertificates[supporterAddress][calculatorItemId] += amountToBurn;

    offsets[id] = Offset(supporterAddress, block.number, amountToBurn, calculatorItemId);
    supporters[supporterAddress].offsetsCount++;

    emit OffsetMade(supporterAddress, id, amountToBurn, calculatorItemId, block.number);
  }

  /**
   * @dev Called by the RC offset function to create a new publication record.
   * @param supporterAddress address of supporter
   * @param amountToBurn Tokens to be burned (minimum 1 token in wei, i.e., 1e18).
   * @param description The description of the post.
   * @param content The content of the post.
   */
  function publish(
    address supporterAddress,
    uint256 amountToBurn,
    string memory description,
    string memory content
  ) external mustBeAllowedCaller {
    publicationsCount++;
    uint64 id = publicationsCount;

    publications[id] = Publication(supporterAddress, block.number, amountToBurn, description, content);

    supporters[supporterAddress].publicationsCount++;

    emit PublicationPosted(supporterAddress, id, amountToBurn, description, block.number);
  }

  /**
   * @notice Allows a supporter to declare a reduction commitment for a specific calculator item.
   * @dev Records the calculator item ID as a commitment for the calling supporter.
   * Requires the calculator item to exist and the sender to be a registered supporter.
   * @param calculatorItemId The ID of the CalculatorItem for which the commitment is being declared.
   */
  function declareReductionCommitment(uint64 calculatorItemId) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(!declaredReduction[msg.sender][calculatorItemId], "Commitment already declared");

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
  ) public view returns (uint256 amountToBurn, uint256 commission, address inviter) {
    Invitation memory invitation = communityRules.getInvitation(supporterAddress);
    bool isInvited = invitation.createdAtBlock != 0; // Check if invitation exists

    inviter = invitation.inviter;

    commission = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    amountToBurn = amount.sub(commission);
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

  /**
   * @notice Checks if a user is a supporter or not.
   * @dev Used by the RegenerationCredit contract to check if user is supporter.
   * @param addr The address to check if is supporter.
   * @return bool True if is supporter, false otherwise.
   */
  function isSupporter(address addr) external view returns (bool) {
    return communityRules.userTypeIs(UserType.SUPPORTER, addr);
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
