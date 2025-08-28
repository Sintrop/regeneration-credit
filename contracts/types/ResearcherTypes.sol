// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev Researcher user type data structure.
 * @param id User id.
 * @param researcherWallet Researcher wallet address.
 * @param name User name.
 * @param pool Pool data.
 * @param proofPhoto Hash of the identity photo.
 * @param publishedResearches Number of published researches.
 * @param lastPublishedAt Block of last research publication.
 * @param publishedItems Number of published researches.
 * @param lastCalculatorItemAt Block of last calculator item publication.
 * @param createdAt Block of user creation.
 */
struct Researcher {
  uint64 id;
  address researcherWallet;
  string name;
  Pool pool;
  string proofPhoto;
  uint256 publishedResearches;
  uint256 lastPublishedAt;
  uint256 publishedItems;
  uint256 lastCalculatorItemAt;
  uint256 createdAt;
  bool canPublishMethod;
}

/**
 * @dev Researcher pool data.
 * @param level User pool level.
 * @param currentEra User currentEra, updated after each withdraw.
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

/**
 * @dev Research data structure.
 * @param id Research id.
 * @param era Era of creation.
 * @param createdBy Researcher wallet address.
 * @param title Research title.
 * @param thesis Research thesis.
 * @param file Hash of the research publication.
 * @param validationsCount Number of invalidation votes.
 * @param valid True if valid, false if invalid.
 * @param invalidateAt Block of invalidation.
 * @param createdAtBlock Block of research creation.
 */
struct Research {
  uint64 id;
  uint256 era;
  address createdBy;
  string title;
  string thesis;
  string file;
  uint256 validationsCount;
  bool valid;
  uint256 invalidatedAt;
  uint256 createdAtBlock;
}

/**
 * @dev Calculator item data structure.
 * @param id Item id.
 * @param createdBy Researcher wallet address.
 * @param title Item title.
 * @param unit Item unit. [Example: Kg, L, kwh]
 * @param justification Justification of the result provided.
 * @param carbonImpact Impact of each item unit in carbon. [g]
 * @param createdAtBlock The block number at which the item was created.
 */
struct CalculatorItem {
  uint64 id;
  address createdBy;
  string item;
  string thesis;
  string unit;
  uint256 carbonImpact;
  uint256 createdAtBlock;
}

/**
 * @dev Evaluation method data structure.
 * @param id Method id.
 * @param createdBy Researcher wallet address.
 * @param title Method title.
 * @param research Paper or justification of the method provided.
 * @param projectURL Project URL or repository address.
 * @param createdAtBlock The block number at which the item was created.
 */
struct EvaluationMethod {
  uint64 id;
  address createdBy;
  string title;
  string research;
  string projectURL;
  uint256 createdAtBlock;
}

/**
 * @dev Research penalty.
 * @param researchId ID of the research that incurred the penalty.
 */
struct Penalty {
  uint256 researchId;
}

/**
 * @dev System used contracts address.
 * @param communityRulesAddress Address of the CommunityRules contract.
 * @param researcherPoolAddress Address of the ResearcherPool contract.
 * @param validationRulesAddress Address of the ValidationRules contract.
 * @param voteRulesAddress Address of the VoteRules contract.
 */
struct ContractsDependency {
  address communityRulesAddress;
  address researcherPoolAddress;
  address validationRulesAddress;
  address voteRulesAddress;
}
