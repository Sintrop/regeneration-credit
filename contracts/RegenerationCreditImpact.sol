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
 * @dev Total impact and total token impact functions
 * @notice Manages and calculates Regeneration Credit system impact
 */
contract RegenerationCreditImpact {
  using SafeMath for uint256;

  uint256 public constant IMPACT_DECIMALS = 10 ** 32;

  RegenerationCredit internal regenerationCredit;
  InspectionRules internal inspectionRules;
  CommunityRules internal communityRules;
  RegeneratorRules internal regeneratorRules;

  constructor(
    address regenerationCreditAddress,
    address inspectionRulesAddress,
    address communityRulesAddress,
    address regeneratorRulesAddress
  ) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
    inspectionRules = InspectionRules(inspectionRulesAddress);
    communityRules = CommunityRules(communityRulesAddress);
    regeneratorRules = RegeneratorRules(regeneratorRulesAddress);
  }

  /**
   * @dev Function to calculate the total carbon impact of the system. It is calculated by dividing the biomass impact by 2, which represents that half of the biomass weight is composed by carbon.
   */
  function totalCarbonImpact() public view returns (uint256) {
    if (inspectionRules.inspectionsCount() == 0) return 0;

    return
      ((inspectionRules.inspectionsBiomassImpact().div(2)) / inspectionRules.inspectionsCount()) *
      regeneratorRules.totalImpactRegenerators();
  }

  /**
   * @dev Function to calculate the total biodiversity impact of the system.
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if (inspectionRules.inspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsBiodiversityImpact().div(inspectionRules.inspectionsCount()).mul(
        regeneratorRules.totalImpactRegenerators()
      );
  }

  /**
   * @dev Function to calculate the total soil impact of the system.
   */
  function totalSoilImpact() public view returns (uint256) {
    return regeneratorRules.regenerationArea();
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the carbon impact per regeneration credit.
   */
  function tokenCarbonImpact() public view returns (uint256) {
    return
      totalCarbonImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the biodiversity impact per regeneration credit.
   */
  function tokenBiodiversityImpact() public view returns (uint256) {
    return
      totalBiodiversityImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the soil impact per regeneration credit.
   */
  function tokenSoilImpact() public view returns (uint256) {
    return
      totalSoilImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }
}
