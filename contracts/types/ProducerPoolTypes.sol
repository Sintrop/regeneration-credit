// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

// TODO: Create issue to Add integration with producerPool
struct Era {
  uint256 tokens;
  uint256 producers;
  uint256 levels;
  ProducerToken[] producerTokens;
}

struct ProducerToken {
  address wallet;
  uint256 tokens;
}
