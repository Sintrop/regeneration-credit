// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

// struct Developer {
//   address _address;
//   uint256 level;
//   uint256 currentEra;
//   uint256 createdAt;
// }

struct Era {
  uint256 era;
  uint256 tokens;
  uint256 developers;
}
