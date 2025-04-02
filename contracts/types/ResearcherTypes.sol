// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

/**
 * @dev Researcher user type data structure
 * @param id User id
 * @param researcherWallet Researcher wallet address
 * @param name User name
 * @param pool Pool data
 * @param proofPhoto Hash of the identity photo
 * @param publishedResearches Number of published researches
 * @param lastPublishedAt Block of last research publication
 * @param lastCalculatorItemAt Block of last calculator item publication
 * @param createdAt Block of user creation
 */
struct Researcher {
  uint256 id;
  address researcherWallet;
  string name;
  Pool pool;
  string proofPhoto;
  uint256 publishedResearches;
  uint256 lastPublishedAt;
  uint256 lastCalculatorItemAt;
  uint256 createdAt;
}

/**
 * @dev Researcher pool data
 */
struct Pool {
  uint256 level;
  uint256 currentEra;
}

struct Research {
  uint256 id;
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

struct CalculatorItem {
  uint256 id;
  address createdBy;
  string title;
  string unit;
  string justification;
  uint256 carbonImpact;
}

struct Penalty {
  uint256 researchId;
}
