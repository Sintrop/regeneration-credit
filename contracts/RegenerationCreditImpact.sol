// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegenerationCredit } from "./RegenerationCredit.sol";
import { InspectionRules } from "./InspectionRules.sol";
import { RegeneratorRules } from "./RegeneratorRules.sol";
import { CommunityRules } from "./CommunityRules.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @author Sintrop
 * @title RegenerationCreditImpact
 * @dev Manage reward to activists
 * @notice Receive tokens for invitation service provided
 */
contract RegenerationCreditImpact {
  using SafeMath for uint256;

  RegenerationCredit internal regenerationCredit;
  InspectionRules internal inspectionRules;
  CommunityRules internal communityRules;
  RegeneratorRules internal regeneratorRules;

  constructor(address regenerationCreditAddress, address inspectionRulesAddress, address communityRulesAddress, address regeneratorRulesAddress) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
    inspectionRules = InspectionRules(inspectionRulesAddress);
    communityRules = CommunityRules(communityRulesAddress);
    regeneratorRules = RegeneratorRules(regeneratorRulesAddress);
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function totalCarbonImpact() public view returns (uint256) {
    if(inspectionRules.inspectionsCount() == 0) return 0;

    return
      ((inspectionRules.inspectionsBiomassImpact().div(2)) / inspectionRules.inspectionsCount()) *
        regeneratorRules.totalImpactRegenerators();
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if(inspectionRules.inspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsBiodiversityImpact().div(inspectionRules.inspectionsCount()).mul(regeneratorRules.totalImpactRegenerators());
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function totalSoilImpact() public view returns (uint256) {
    return regeneratorRules.regenerationArea();
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function tokenCarbonImpact() public view returns (uint256) {
    return totalCarbonImpact().mul(10 ** 32).div(
      regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
    );
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function tokenBiodiversityImpact() public view returns (uint256) {

    return totalBiodiversityImpact().mul(10 ** 32).div(
      regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
    );
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function tokenSoilImpact() public view returns (uint256) {
    return totalSoilImpact().mul(10 ** 32).div(
      regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
    );
  }
}
