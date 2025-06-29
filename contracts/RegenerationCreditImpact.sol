// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IRegenerationCredit_Impact } from "./interfaces/IRegenerationCredit_Impact.sol";
import { IInspectionRules_Impact } from "./interfaces/IInspectionRules_Impact.sol";
import { IRegeneratorRules_Impact } from "./interfaces/IRegeneratorRules_Impact.sol";
import { UserType } from "./types/CommunityTypes.sol";

/**
 * @title RegenerationCreditImpact
 * @author Sintrop
 * @dev Total impact and token impact functions.
 * @notice Manages and calculates Regeneration Credit system impact. This contract is responsible for
 * calculating the system impact and also the impact per token. This is the foundation, the community impact is what is backing the Regeneration Credit.
 */
contract RegenerationCreditImpact {
  using SafeMath for uint256;

  // --- State Variables ---

  /// @notice Constant of 32 decimals to calculate the impact. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
  uint256 public constant IMPACT_DECIMALS = 10 ** 32;

  /**
   * @notice [g]
   * This constant estimates an average carbon sequestration of 100000g (or 100kg) per tree, palm tree and other plants with over 3cm in diameter and 1 meter high recorded by inspectors.
   * In practice, it is not so simple to make this relationship, as the actual amount of carbon sequestered will vary from species to species,
   * from biome to biome, from soil to soil, from management to management and from each geolocation.
   * However, we need to standardize this value to simplify and allow the decentralized certification system to occur.
   * This result was obtained by estimating that, on average, each tree/plant sequesters 10 kg of carbon per year, living an average of 10 years. With the result expressed in grams [g].
   */
  uint256 public constant CARBON_PER_TREE = 100000;

  IRegenerationCredit_Impact internal regenerationCredit;
  IInspectionRules_Impact internal inspectionRules;
  IRegeneratorRules_Impact internal regeneratorRules;

  // --- Constructor ---

  /**
   * @notice Initializes the RegenerationCreditImpact contract with addresses of necessary external contracts.
   * @dev This constructor links to core system contracts required for impact calculations.
   * @param regenerationCreditAddress Address of the RegenerationCredit token contract.
   * @param inspectionRulesAddress Address of the InspectionRules contract.
   * @param regeneratorRulesAddress Address of the RegeneratorRules contract.
   */
  constructor(address regenerationCreditAddress, address inspectionRulesAddress, address regeneratorRulesAddress) {
    regenerationCredit = IRegenerationCredit_Impact(regenerationCreditAddress);
    inspectionRules = IInspectionRules_Impact(inspectionRulesAddress);
    regeneratorRules = IRegeneratorRules_Impact(regeneratorRulesAddress);
  }

  // --- View Functions ---

  /**
   * @notice Calculates the total trees impact of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total trees.
   * @return uint256 Amount of trees
   */
  function totalTreesImpact() public view returns (uint256) {
    if (inspectionRules.realizedInspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsTreesImpact().mul(regeneratorRules.totalImpactRegenerators()).div(
        inspectionRules.realizedInspectionsCount()
      );
  }

  /**
   * @notice Calculates the total carbon impact of the system.
   * @dev Converts the total trees impact into estimated grams of carbon sequestered.
   * @return uint256 Grams of carbon [g]
   */
  function totalCarbonImpact() public view returns (uint256) {
    return totalTreesImpact().mul(CARBON_PER_TREE);
  }

  /**
   * @notice Calculates the total biodiversity impact of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total biodiversity species registered.
   * @return uint256 Amount of species
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if (inspectionRules.realizedInspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsBiodiversityImpact().mul(regeneratorRules.totalImpactRegenerators()).div(
        inspectionRules.realizedInspectionsCount()
      );
  }

  /**
   * @notice Calculates the total soil impact of the system.
   * @dev This directly returns the total regeneration area reported by regenerators.
   * @return uint256 Area under regeneration [m²]
   */
  function totalSoilImpact() public view returns (uint256) {
    return regeneratorRules.regenerationArea();
  }

  /**
   * @notice Calculates the trees impact per Regeneration Credit.
   * @dev The denominator represents the sum of currently circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @return uint256 Trees per token (with IMPACT_DECIMALS precision)
   */
  function treesPerToken() public view returns (uint256) {
    return
      totalTreesImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @notice Calculates the carbon impact per Regeneration Credit.
   * @dev The denominator represents the sum of currently circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @return uint256 Grams of carbon per token (with IMPACT_DECIMALS precision)
   */
  function carbonPerToken() public view returns (uint256) {
    return
      totalCarbonImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @notice Calculates the biodiversity impact per Regeneration Credit.
   * @dev The denominator represents the sum of currently circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @return uint256 Amount of species per token (with IMPACT_DECIMALS precision)
   */
  function biodiversityPerToken() public view returns (uint256) {
    return
      totalBiodiversityImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }

  /**
   * @notice Calculates the soil impact per Regeneration Credit.
   * @dev The denominator represents the sum of currently circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * 32 decimal places are used for the calculation. To get the exact result, it is necessary to add 32 decimal places to the value returned by the function.
   * @return uint256 Area [m²] per token (with IMPACT_DECIMALS precision)
   */
  function soilPerToken() public view returns (uint256) {
    return
      totalSoilImpact().mul(IMPACT_DECIMALS).div(
        regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_()
      );
  }
}
