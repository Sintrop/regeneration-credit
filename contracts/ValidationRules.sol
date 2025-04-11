// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { CommunityRules } from "./CommunityRules.sol";
import { RegeneratorRules } from "./RegeneratorRules.sol";
import { UserValidation, ResourceValidation, ContractsDependency } from "./types/ValidationTypes.sol";
import { UserType } from "./types/CommunityTypes.sol";
import { Callable } from "./shared/Callable.sol";
import { InspectorRules } from "./InspectorRules.sol";
import { DeveloperRules } from "./DeveloperRules.sol";
import { ResearcherRules } from "./ResearcherRules.sol";
import { ContributorRules } from "./ContributorRules.sol";
import { ActivistRules } from "./ActivistRules.sol";
import { Inspection } from "./types/InspectionTypes.sol";
import { Report } from "./types/DeveloperTypes.sol";
import { Research } from "./types/ResearcherTypes.sol";
import { VoteRules } from "./VoteRules.sol";

/**
 * @author Sintrop
 * @title ValidationRules
 * @dev Manage validators rules and data
 * @notice Responsible for reviewing and voting to invalidate wrong or corrupted actions
 */
contract ValidationRules is Callable {
  mapping(address => UserValidation[]) private userValidations;
  mapping(uint256 => ResourceValidation[]) public inspectionValidations;
  mapping(uint256 => ResourceValidation[]) public reportValidations;
  mapping(uint256 => ResourceValidation[]) public researchValidations;
  mapping(address => mapping(uint256 => bool)) private validatorReportsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorInspectionsValidations;
  mapping(address => mapping(uint256 => bool)) private validatorResearchesValidations;
  mapping(address => mapping(address => bool)) private validatorUsersValidations;
  mapping(address => uint256) private validatorLastVoteAt;

  CommunityRules private communityRules;
  RegeneratorRules private regeneratorRules;
  InspectorRules private inspectorRules;
  DeveloperRules private developerRules;
  ResearcherRules private researcherRules;
  ContributorRules private contributorRules;
  ActivistRules private activistRules;

  /// @notice VoteRules contract address
  VoteRules internal voteRules;

  uint256 private immutable timeBetweenVotes;

  constructor(uint256 timeBetweenVotes_) {
    timeBetweenVotes = timeBetweenVotes_;
  }

  function setContractAddressDependencies(ContractsDependency memory contractDependency) public onlyOwner {
    communityRules = CommunityRules(contractDependency.communityRulesAddress);
    regeneratorRules = RegeneratorRules(contractDependency.regeneratorRulesAddress);
    inspectorRules = InspectorRules(contractDependency.inspectorRulesAddress);
    developerRules = DeveloperRules(contractDependency.developerRulesAddress);
    researcherRules = ResearcherRules(contractDependency.researcherRulesAddress);
    contributorRules = ContributorRules(contractDependency.contributorRulesAddress);
    activistRules = ActivistRules(contractDependency.activistRulesAddress);
    voteRules = VoteRules(contractDependency.voteRulesAddress);    
  }

  function addUserValidation(address userAddress, string memory justification) public {
    require(voteRules.canVote(msg.sender), "User can not vote");
    require(!communityRules.userTypeIs(UserType.UNDEFINED, userAddress), "User not registered");
    require(!communityRules.userTypeIs(UserType.DENIED, userAddress), "User already denied");
    require(!validatorUsersValidations[msg.sender][userAddress], "Already voted");
    require(waitedTimeBetweenVotes(msg.sender), "Wait timeBetweenVotes");

    validatorUsersValidations[msg.sender][userAddress] = true;
    validatorLastVoteAt[msg.sender] = block.number;

    uint256 majorityValidatorsCount_ = votesToInvalidate();
    uint256 validationsCount = userValidations[userAddress].length + 1;

    userValidations[userAddress].push(
      UserValidation(msg.sender, userAddress, justification, majorityValidatorsCount_, block.number)
    );

    if (validationsCount >= majorityValidatorsCount_) denieUser(userAddress);
  }

  function addInspectionValidation(
    Inspection memory inspection,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorInspectionsValidations[validatorAddress][inspection.id], "Already voted");
    require(waitedTimeBetweenVotes(validatorAddress), "Wait timeBetweenVotes");

    validatorInspectionsValidations[validatorAddress][inspection.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 majorityValidatorsCount_ = votesToInvalidate();

    bool addPenalty = inspection.validationsCount >= majorityValidatorsCount_;

    inspectionValidations[inspection.id].push(
      ResourceValidation(validatorAddress, inspection.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 inspectorTotalPenalties = inspectorRules.addPenalty(inspection.inspector, inspection.id);
    removeUserInspection(inspection);

    if (inspectorTotalPenalties >= inspectorRules.maxPenalties()) externalDenieUser(inspection.inspector);
  }

  function addDeveloperReportValidation(
    Report memory report,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorReportsValidations[validatorAddress][report.id], "Already voted");
    require(waitedTimeBetweenVotes(validatorAddress), "Wait timeBetweenVotes");

    validatorReportsValidations[validatorAddress][report.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    reportValidations[report.id].push(
      ResourceValidation(validatorAddress, report.id, justification, votesToInvalidate(), block.number)
    );

    if (report.valid) return;

    uint256 developerTotalPenalties = developerRules.addPenalty(report.developer, report.id);

    removeDeveloperReport(report);

    if (developerTotalPenalties >= developerRules.MAX_PENALTIES()) externalDenieUser(report.developer);
  }

  function addResearcherResearchValidation(
    Research memory research,
    string memory justification,
    address validatorAddress
  ) public mustBeAllowedCaller {
    require(!validatorResearchesValidations[validatorAddress][research.id], "Already voted");
    require(waitedTimeBetweenVotes(validatorAddress), "Wait timeBetweenVotes");

    validatorResearchesValidations[validatorAddress][research.id] = true;
    validatorLastVoteAt[validatorAddress] = block.number;

    uint256 majorityValidatorsCount_ = votesToInvalidate();

    bool addPenalty = research.validationsCount >= majorityValidatorsCount_;

    researchValidations[research.id].push(
      ResourceValidation(validatorAddress, research.id, justification, majorityValidatorsCount_, block.number)
    );

    if (!addPenalty) return;

    uint256 totalPenalties = researcherRules.addPenalty(research.createdBy, research.id);
    removeReseacherResearch(research);

    if (totalPenalties >= researcherRules.MAX_PENALTIES()) externalDenieUser(research.createdBy);
  }

  function removeDeveloperReport(Report memory report) internal {
    removeLevelsFromPool(report.developer, 1);
  }

  function removeReseacherResearch(Research memory research) internal {
    removeLevelsFromPool(research.createdBy, 1);
  }

  function removeUserInspection(Inspection memory inspection) internal {
    inspectorRules.decrementInspections(inspection.inspector);
    regeneratorRules.decrementInspections(inspection.regenerator);

    removeLevelsFromPool(inspection.inspector, 1);
    removeLevelsFromPool(inspection.regenerator, inspection.regenerationScore);
  }

  function externalDenieUser(address userAddress) private {
    denieUser(userAddress);
  }

  function denieUser(address userAddress) internal {
    removeLevelsFromPool(userAddress, 0);
    communityRules.setDeniedType(userAddress);
  }

  function removeLevelsFromPool(address userAddress, uint256 levels) internal {
    UserType oldUserType = communityRules.getUser(userAddress);

    if (oldUserType == UserType.INSPECTOR) return inspectorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.REGENERATOR) return regeneratorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.DEVELOPER) return developerRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.RESEARCHER) return researcherRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.CONTRIBUTOR) return contributorRules.removePoolLevels(userAddress, levels);
    if (oldUserType == UserType.ACTIVIST) return activistRules.removePoolLevels(userAddress, levels);
  }

  function getUserValidations(address userAddress) public view returns (UserValidation[] memory) {
    return userValidations[userAddress];
  }

  function votesToInvalidate() public view returns (uint256 count) {
    uint256 voters = communityRules.votersCount();

    if (voters <= 50) return 2;
    if (voters > 50 && voters <= 500) return 5;
    if (voters > 500 && voters <= 1000) return 10;
    if (voters > 1000 && voters <= 2000) return 20;
    if (voters > 2000 && voters <= 4000) return 40;
    if (voters > 4000 && voters <= 8000) return 80;
    if (voters > 8000 && voters <= 16000) return 160;        
    if (voters > 16000 && voters <= 32000) return 320;        
    if (voters > 32000) return 500;
  }
  
  function waitedTimeBetweenVotes(address validatorAddress) internal view returns (bool) {
    uint256 lastVoteAt = validatorLastVoteAt[validatorAddress];

    bool canVote = block.number > lastVoteAt + timeBetweenVotes;
    return canVote || lastVoteAt == 0;
  }  
}
