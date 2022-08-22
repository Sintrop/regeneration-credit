// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

struct Era {
  uint256 tokens;
  uint256 developers;
  uint256 levels;
  DeveloperToken[] developerTokens;
}

struct DeveloperToken {
  address wallet;
  uint256 tokens;
}
