// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum Isas {
  TOTALLY_SUSTAINABLE,
  PARTIAL_SUSTAINABLE,
  NEUTRO,
  PARTIAL_NOT_SUSTAINABLE,
  TOTALLY_NOT_SUSTAINABLE
}

struct Category {
  uint256 id;
  address createdBy;
  string name;
  string description;
  string tutorial;
  string totallySustainable;
  string partiallySustainable;
  string neutro;
  string partiallyNotSustainable;
  string totallyNotSustainable;
  uint256 votesCount;
}
