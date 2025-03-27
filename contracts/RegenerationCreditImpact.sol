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

  /// @notice Constant of 32 decimals to calculate the impact. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
  uint256 public constant IMPACT_DECIMALS = 10 ** 32;

  /**
   * @notice [kg]
   * This constant estimates an average carbon sequestration of 100 kg per tree, palm tree and other plants with more than 5cm in diameter recorded by inspectors.
   * In practice, it is not so simple to make this relationship, as the actual amount of carbon sequestered will vary from species to species,
   * from biome to biome, from soil to soil, from management to management and from each geolocation.
   * However, we need to standardize this value to simplify and allow the decentralized certification system to occur.
   * This result was obtained by estimating that, on average, each tree/plant sequesters 10 kg of carbon per year, living an average of 10 years.
   */
  uint256 public constant CARBON_PER_TREE = 100;

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
   * @notice Function to calculate the total trees impact of the system.
   * @return uint256 Amount of trees
   */
  function totalTreesImpact() public view returns (uint256) {
    if (inspectionRules.inspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsTreesImpact().div(inspectionRules.inspectionsCount()).mul(
        regeneratorRules.totalImpactRegenerators()
      );
  }

  /**
   * @notice Function to calculate the total carbon impact of the system.
   * @return uint256 Kg of carbon [kg]
   */
  function totalCarbonImpact() public view returns (uint256) {
    if (inspectionRules.inspectionsCount() == 0) return 0;

    return totalTreesImpact().mul(CARBON_PER_TREE);
  }

  /**
   * @notice Function to calculate the total biodiversity impact of the system.
   * @return uint256 Amount of species
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if (inspectionRules.inspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsBiodiversityImpact().div(inspectionRules.inspectionsCount()).mul(
        regeneratorRules.totalImpactRegenerators()
      );
  }

  /**
   * @notice Function to calculate the total soil impact of the system.
   * @return uint256 Area under regeneration [m²]
   */
  function totalSoilImpact() public view returns (uint256) {
    return regeneratorRules.regenerationArea();
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the trees impact per regeneration credit.
   */
  function treesPerToken() public view returns (uint256) {
    return
      totalTreesImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the carbon impact per regeneration credit.
   */
  function carbonPerToken() public view returns (uint256) {
    return
      totalCarbonImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the biodiversity impact per regeneration credit.
   */
  function biodiversityPerToken() public view returns (uint256) {
    return
      totalBiodiversityImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @dev 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @notice Function that calculates the soil impact per regeneration credit
   * @return uint256 Area [m²]
   */
  function soilPerToken() public view returns (uint256) {
    return
      totalSoilImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }
}
