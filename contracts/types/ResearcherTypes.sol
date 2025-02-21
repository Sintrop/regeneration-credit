// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./CommunityTypes.sol";

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
