// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserRules } from "./UserRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { CalculatorItem } from "./types/ResearcherTypes.sol";
import { Supporter } from "./types/SupporterTypes.sol";
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

  uint256 public constant INVITER_PERCENTAGE = 5;

  UserRules internal userRules;
  SupporterPool internal supporterPool;
  ResearcherRules internal researcherRules;
  address[] internal supportersAddress;
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
    Supporter memory supporter = Supporter(userRules.userTypesCount(USER_TYPE) + 1, msg.sender, name, block.number);

    supporters[msg.sender] = supporter;
    supportersAddress.push(msg.sender);
    userRules.addUser(msg.sender, USER_TYPE);

    return supporter;
  }

  function burnTokens(uint256 amount, uint256 calculatorItemId) public {
    require(userRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");
    require(amount > 0, "Amount invalid");

    Invitation memory invitation = userRules.getInvitation(msg.sender);
    bool isInvited = invitation.createdAtBlock != 0;

    uint256 inviterTotalTokens = isInvited ? amount.mul(INVITER_PERCENTAGE).div(100) : 0;
    uint256 amountBurn = amount.sub(inviterTotalTokens);

    if (calculatorItemId > 0) {
      CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);
      if (calculatorItem.id > 0) calculatorItemCertificates[msg.sender][calculatorItemId] = amountBurn;
    }

    supporterPool.burnTokens(msg.sender, invitation.inviter, amountBurn, inviterTotalTokens);
  }

  function declareReductionCommitment(uint256 calculatorItemId) public {
    require(userRules.userTypeIs(UserType.SUPPORTER, msg.sender), "Only supporters");

    CalculatorItem memory calculatorItem = researcherRules.getCalculatorItem(calculatorItemId);

    require(calculatorItem.id > 0, "CalculatorItem does not exists");

    reductionCommitments[msg.sender].push(calculatorItemId);
  }

  function getReductionCommitments(address addr) public view returns (uint256[] memory) {
    return reductionCommitments[addr];
  }

  /**
   * @dev Returns all registered supporters
   * @return Supporter struct array
   */
  function getSupporters() public view returns (Supporter[] memory) {
    uint256 usersCount = userRules.userTypesCount(USER_TYPE);
    Supporter[] memory supporterList = new Supporter[](usersCount);

    for (uint256 i = 0; i < usersCount; i++) {
      address acAddress = supportersAddress[i];
      supporterList[i] = supporters[acAddress];
    }

    return supporterList;
  }

  /**
   * @dev Return a specific supporter
   * @param addr the address of the supporter.
   */
  function getSupporter(address addr) public view returns (Supporter memory) {
    return supporters[addr];
  }
}
