// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter, Publication } from "./types/SupporterTypes.sol";
import { UserType, Invitation } from "./types/UserTypes.sol";
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

  mapping(address => Supporter) internal supporters;
  mapping(address => mapping(uint256 => uint256)) public calculatorItemCertificates;
  mapping(address => uint256[]) public reductionCommitments;
  mapping(uint256 => address) public supportersAddress;
  mapping(address => Publication[]) public publications;

  uint256 public constant INVITER_PERCENTAGE = 5;

  UserRules internal userRules;
  SupporterPool internal supporterPool;
  ResearcherRules internal researcherRules;
  UserType private constant USER_TYPE = UserType.SUPPORTER;

  constructor(address userRulesAddress, address supporterPoolAddress, address researcherRulesAddress) {
    userRules = UserRules(userRulesAddress);
    supporterPool = SupporterPool(supporterPoolAddress);
    researcherRules = ResearcherRules(researcherRulesAddress);
  }

  /**
   * @dev Allow new register of supporter
   * @param name the name of the supporter
   * @return a supporter
   */
  function addSupporter(string memory name) public returns (Supporter memory) {
    uint256 id = userRules.userTypesCount(USER_TYPE) + 1;

    Supporter memory supporter = Supporter(id, msg.sender, name, block.number);

    supporters[msg.sender] = supporter;
    supportersAddress[id] = msg.sender;
    userRules.addUser(msg.sender, USER_TYPE);

    return supporter;
  }

  function burnTokens(uint256 amount, uint256 calculatorItemId) public {
    require(userRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 0, "Amount invalid");

    uint256 amountBurn = burnTokensInternal(msg.sender, amount);

    if (calculatorItemId > 0) {
      CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);
      if (calculatorItem.id > 0) calculatorItemCertificates[msg.sender][calculatorItemId] = amountBurn;
    }
  }

  function burnTokensPublication(uint256 amount, string memory description, string memory content) public {
    require(userRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 1, "Amount invalid");

    burnTokensInternal(msg.sender, amount);

    publications[msg.sender].push(Publication(amount, description, content));
  }

  function burnTokensInternal(address addr, uint256 amount) internal returns (uint256) {
    Invitation memory invitation = userRules.getInvitation(addr);
    bool isInvited = invitation.createdAtBlock != 0;

    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    uint256 amountBurn = amount.sub(inviterTotalTokens);

    supporterPool.burnTokens(msg.sender, invitation.inviter, amountBurn, inviterTotalTokens);

    return amountBurn;
  }

  function declareReductionCommitment(uint256 calculatorItemId) public {
    require(userRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

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
