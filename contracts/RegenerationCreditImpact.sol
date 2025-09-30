// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import { IRegenerationCredit } from "./interfaces/IRegenerationCredit.sol";
import { IInspectionRules } from "./interfaces/IInspectionRules.sol";
import { IRegeneratorRules } from "./interfaces/IRegeneratorRules.sol";

/**
 * @title RegenerationCreditImpact
 * @author Sintrop
 * @dev Manages and calculates Regeneration Credit system impact.
 * @notice This contract is responsible for calculating the system impact and also the impact per token.
 * The community impact backs the Regeneration Credit, it is the foundation of the System.
 */
contract RegenerationCreditImpact {
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

  /// @notice Interface to the `RegenerationCredit` contract.
  IRegenerationCredit public regenerationCredit;

  /// @notice Interface to the `InspectionRules` contract.
  IInspectionRules public inspectionRules;

  /// @notice Interface to the `RegeneratorRules` contract.
  IRegeneratorRules public regeneratorRules;

  // --- Constructor ---

  /**
   * @notice Initializes the RegenerationCreditImpact contract with addresses of necessary external contracts.
   * @dev This constructor links to core system contracts required for impact calculations.
   * @param regenerationCreditAddress Address of the RegenerationCredit token contract.
   * @param inspectionRulesAddress Address of the InspectionRules contract.
   * @param regeneratorRulesAddress Address of the RegeneratorRules contract.
   */
  constructor(address regenerationCreditAddress, address inspectionRulesAddress, address regeneratorRulesAddress) {
    regenerationCredit = IRegenerationCredit(regenerationCreditAddress);
    inspectionRules = IInspectionRules(inspectionRulesAddress);
    regeneratorRules = IRegeneratorRules(regeneratorRulesAddress);
  }

  // --- Public functions ---

  /**
   * @notice Calculates the total trees of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total trees.
   * @return uint256 Amount of trees.
   */
  function totalTreesImpact() public view returns (uint256) {
    if (inspectionRules.realizedInspectionsCount() == 0) return 0;

    return
      (inspectionRules.inspectionsTreesImpact() * inspectionRules.totalImpactRegenerators()) /
      inspectionRules.realizedInspectionsCount();
  }

  /**
   * @notice Calculates the total carbon impact of the system.
   * @dev Converts the total trees impact into estimated grams of carbon sequestered.
   * @return uint256 Grams of carbon [g].
   */
  function totalCarbonImpact() public view returns (uint256) {
    return totalTreesImpact() * CARBON_PER_TREE;
  }

  /**
   * @notice Calculates the total biodiversity impact of the system.
   * @dev This function uses data from inspections and regenerator impact to estimate total biodiversity species registered.
   * @return uint256 Total amount of species.
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if (inspectionRules.realizedInspectionsCount() == 0) return 0;

    return
      (inspectionRules.inspectionsBiodiversityImpact() * inspectionRules.totalImpactRegenerators()) /
      inspectionRules.realizedInspectionsCount();
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
  function treesPerToken() external view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return (totalTreesImpact() * PRECISION_FACTOR) / effectiveSupply;
  }

  /**
   * @notice Calculates the carbon impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Grams of carbon per token (with 18-decimal precision).
   */
  function carbonPerToken() external view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return (totalCarbonImpact() * PRECISION_FACTOR) / effectiveSupply;
  }

  /**
   * @notice Calculates the biodiversity impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Amount of species per token (with 18-decimal precision).
   */
  function biodiversityPerToken() external view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return (totalBiodiversityImpact() * PRECISION_FACTOR) / effectiveSupply;
  }

  /**
   * @notice Calculates the area impact per Regeneration Credit. The effectiveSupply is the sum of currently
   * circulating tokens (total supply minus locked) AND all tokens that have ever been burned (certified).
   * This provides an impact metric based on all tokens that have contributed to or represent impact, whether currently in circulation or already consumed.
   * @dev The result is a fixed-point number with 18 decimals of precision. It can be formatted
   * in a frontend using standard libraries (e.g., ethers.utils.formatUnits(result, 18)).
   * @return uint256 Area [m²] per token (with 18-decimal precision).
   */
  function areaPerToken() external view returns (uint256) {
    uint256 effectiveSupply = _getEffectiveSupply();
    if (effectiveSupply == 0) return 0;

    return (totalAreaImpact() * PRECISION_FACTOR) / effectiveSupply;
  }

  // --- Private Functions ---

  /**
   * @dev Private function to calculate the effective token supply used in impact calculations.
   * @return The total supply plus certified tokens minus locked tokens.
   */
  function _getEffectiveSupply() private view returns (uint256) {
    return regenerationCredit.totalSupply() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_();
  }
}
