// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

enum Isas {
  REGENERATIVE3,
  REGENERATIVE2,
  REGENERATIVE1,
  NEUTRO,
  NOT_REGENERATIVE1,
  NOT_REGENERATIVE2,
  NOT_REGENERATIVE3
}

struct Category {
  uint256 id;
  address createdBy;
  string name;
  string description;
  string tutorial;
  string regenerative3;
  string regenerative2;
  string regenerative1;
  string neutro;
  string notRegenerative1;
  string notRegenerative2;
  string notRegenerative3;
  uint256 votesCount;
}