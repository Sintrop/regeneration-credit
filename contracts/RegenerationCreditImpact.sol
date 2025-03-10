// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { RegenerationCredit } from "./RegenerationCredit.sol";
import { InspectionRules } from "./InspectionRules.sol";
import { UserRules } from "./UserRules.sol";
import { UserType } from "./types/UserTypes.sol";
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
  UserRules internal userRules;

  constructor(address regenerationCreditAddress, address inspectionRulesAddress, address userRulesAddress) {
    regenerationCredit = RegenerationCredit(regenerationCreditAddress);
    inspectionRules = InspectionRules(inspectionRulesAddress);
    userRules = UserRules(userRulesAddress);
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function totalCarbonImpact() public view returns (uint256) {
    if(inspectionRules.inspectionsCount() == 0) return 0;

    return
      ((inspectionRules.inspectionsBiomassImpact()  / 2) / inspectionRules.inspectionsCount()) *
      regeneratorRules.totalImpactRegenerators();
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function totalBiodiversityImpact() public view returns (uint256) {
    if(inspectionRules.inspectionsCount() == 0) return 0;

    return
      (inspectionRules.inspectionsBiodiversityImpact() / inspectionRules.inspectionsCount()) *
      regeneratorRules.totalImpactRegenerators();
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
    return
      totalCarbonImpact() /
      (regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_());
  }

  /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function tokenBiodiversityImpact() public view returns (uint256) {
    return
      totalBiodiversityImpact() /
      (regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_());
  }

    /**
   * @dev Called by the activist contract, this function calls the token contract to transfer the rewards
   */
  function tokenSoilImpact() public view returns (uint256) {
    return
      totalSoilImpact() /
      (regenerationCredit.totalSupply_() + regenerationCredit.totalCertified_() - regenerationCredit.totalLocked_());
  }
}
