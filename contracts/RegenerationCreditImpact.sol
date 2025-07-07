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

  // --- Constants ---

  /**
   * @notice [g]
   * This constant estimates an average carbon sequestration of 100000g (or 100kg) per tree, palm tree and other plants with over 3cm in diameter and 1 meter high recorded by inspectors.
   * In practice, it is not so simple to make this relationship, as the actual amount of carbon sequestered will vary from species to species,
   * from biome to biome, from soil to soil, from management to management and from each geolocation.
   * However, we need to standardize this value to simplify and allow the decentralized certification system to occur.
   * This result was obtained by estimating that, on average, each tree/plant sequesters 10 kg of carbon per year, living an average of 10 years. With the result expressed in grams [g].
   */
  uint256 public constant CARBON_PER_TREE = 100000;

  /// @notice A scaling factor to perform fixed-point math, ensuring the result has a standard 18-decimal precision.
  /// @dev This is calculated as 10**(token_decimals + result_decimals) = 10**(18 + 18) = 10**36.
  uint256 private constant PRECISION_FACTOR = 10 ** 36;

  // --- State variables ---

  IRegenerationCredit_Impact private regenerationCredit;
  IInspectionRules_Impact private inspectionRules;
  IRegeneratorRules_Impact private regeneratorRules;

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

  // --- Public Functions ---

  /**
   * @notice Calculates the total trees impact of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total trees.
   * @return uint256 Amount of trees.
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
   * @return uint256 Grams of carbon [g].
   */
  function totalCarbonImpact() public view returns (uint256) {
    return totalTreesImpact().mul(CARBON_PER_TREE);
  }

  /**
   * @notice Calculates the total biodiversity impact of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total biodiversity species registered.
   * @return uint256 Total amount of species.
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if (inspectionRules.realizedInspectionsCount() == 0) return 0;

    return
      inspectionRules.inspectionsBiodiversityImpact().mul(regeneratorRules.totalImpactRegenerators()).div(
        inspectionRules.realizedInspectionsCount()
      );
  }

  /**
   * @notice Calculates the total area in regeneration proccess of the system.
   * @dev This directly returns the total regeneration area reported by regenerators.
   * @return uint256 Area under regeneration [m²].
   */
  function totalAreaImpact() public view returns (uint256) {
    return regeneratorRules.regenerationArea();
  }

  /**
   * @notice Calculates the trees impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Trees per token (with 18-decimal precision).
   */
  function treesPerToken() public view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return totalTreesImpact().mul(PRECISION_FACTOR).div(effectiveSupply);
  }

  /**
   * @notice Calculates the carbon impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Grams of carbon per token (with 18-decimal precision).
   */
  function carbonPerToken() public view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return totalCarbonImpact().mul(PRECISION_FACTOR).div(effectiveSupply);
  }

  /**
   * @notice Calculates the biodiversity impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Amount of species per token (with 18-decimal precision).
   */
  function biodiversityPerToken() public view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return totalBiodiversityImpact().mul(PRECISION_FACTOR).div(effectiveSupply);
  }

  /**
   * @notice Calculates the area impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Area [m²] per token (with 18-decimal precision).
   */
  function areaPerToken() public view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return totalAreaImpact().mul(PRECISION_FACTOR).div(effectiveSupply);
  }

  // --- Internal Functions ---

  /**
   * @dev Internal helper function to calculate the effective token supply used in impact calculations.
   * @return The total supply plus certified tokens minus locked tokens.
   */
  function _getEffectiveSupply() internal view returns (uint256) {
    return regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_();
  }
}
