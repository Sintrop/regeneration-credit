// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter, Publication, PublicationId, Offset, OffsetId } from "./types/SupporterTypes.sol";
import { UserType, Invitation } from "./types/CommunityTypes.sol";
import { SupporterPool } from "./SupporterPool.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title SupporterRules
 * @dev Manage supporters rules and data
 * @notice Burn tokens to compensate your degradation
 */
contract SupporterRules {
  using SafeMath for uint256;

  /// @notice The relationship between address and supporter data
  mapping(address => Supporter) internal supporters;

  /// @notice The relationship between address and burned tokens per item
  mapping(address => mapping(uint256 => uint256)) public calculatorItemCertificates;

  /// @notice The relationship between address and reduction commitment statements
  mapping(address => uint256[]) public reductionCommitments;

  /// @notice The relationship between id and supporter address
  mapping(uint256 => address) public supportersAddress;

  /// @notice The relationship between address and publications made
  mapping(uint256 => Publication) public publications;

  /// @notice The relationship between address and publications made
  mapping(address => PublicationId[]) public publicationIds;

  uint256 public publicationsCount;

  mapping(uint256 => Offset) public offsets;

  mapping(address => OffsetId[]) public offsetIds;

  uint256 public offsetsCount;

  /// @notice Commission percentage on invited burn
  uint256 public constant INVITER_PERCENTAGE = 5;

  /// @notice CommunityRules contract address
  CommunityRules internal communityRules;

  /// @notice SupporterPool contract address
  SupporterPool internal supporterPool;

  /// @notice ResearcherRules contract address
  ResearcherRules internal researcherRules;

  /// @notice Supporter UserType
  UserType private constant USER_TYPE = UserType.SUPPORTER;

  constructor(address communityRulesAddress, address supporterPoolAddress, address researcherRulesAddress) {
    communityRules = CommunityRules(communityRulesAddress);
    supporterPool = SupporterPool(supporterPoolAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
  }

  /**
   * @notice Allow new register of supporter
   * @param name The name of the supporter
   * @return a supporter
   */
  function addSupporter(string memory name, string memory profilePhoto) public returns (Supporter memory) {
    uint256 id = communityRules.userTypesTotalCount(USER_TYPE) + 1;

    Supporter memory supporter = Supporter(id, msg.sender, name, profilePhoto, block.number);

    supporters[msg.sender] = supporter;
    supportersAddress[id] = msg.sender;
    communityRules.addUser(msg.sender, USER_TYPE);

    return supporter;
  }

  function updateProfilePhoto(string memory newPhoto) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    supporters[msg.sender].profilePhoto = newPhoto;
  }

  /**
   * @notice Burn tokens to compensate for a specific item
   * @param amount Tokens burned
   * @param calculatorItemId Calculator item id
   */
  function offset(uint256 amount, uint256 calculatorItemId) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 0, "Amount invalid");

    uint256 amountBurn = burnTokens(amount);

    uint256 id = offsetsCount + 1;

    if (calculatorItemId > 0) {
      CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);
      if (calculatorItem.id > 0) calculatorItemCertificates[msg.sender][calculatorItemId] = amountBurn;
    }

    offsets[id] = Offset(msg.sender, block.number, amountBurn, calculatorItemId);

    offsetIds[msg.sender].push(OffsetId(id));
    offsetsCount++;
  }

  /**
   * @notice Burn tokens to post
   * @param amount Tokens burned
   * @param description Post description
   * @param content Post content
   */
  function publish(uint256 amount, string memory description, string memory content) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 1, "Amount invalid");

    uint256 amountBurn = burnTokens(amount);

    uint256 id = publicationsCount + 1;

    publications[id] = Publication(msg.sender, block.number, amountBurn, description, content);

    publicationIds[msg.sender].push(PublicationId(id));
    publicationsCount++;
  }

  function burnTokens(uint256 amount) internal returns (uint256) {
    Invitation memory invitation = communityRules.getInvitation(msg.sender);
    bool isInvited = invitation.createdAtBlock != 0;

    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    uint256 amountBurn = amount.sub(inviterTotalTokens);

    supporterPool.burnTokens(msg.sender, invitation.inviter, amountBurn, inviterTotalTokens);

    return amountBurn;
  }

  /**
   * @notice Declare reduction comitment for a specific item
   * @param calculatorItemId Calculator item id
   */
  function declareReductionCommitment(uint256 calculatorItemId) public {
    require(communityRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);

    require(calculatorItem.id > 0, "Calculator item does not exist");

    reductionCommitments[msg.sender].push(calculatorItemId);
  }

  function getReductionCommitments(address addr) public view returns (uint256[] memory) {
    return reductionCommitments[addr];
  }

  /**
   * @dev Return a specific supporter
   * @param addr the address of the supporter.
   */
  function getSupporter(address addr) public view returns (Supporter memory) {
    return supporters[addr];
  }
}
