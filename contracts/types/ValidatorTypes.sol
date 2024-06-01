// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./UserTypes.sol";

struct Validator {
  uint256 id;
  address validatorWallet;
  UserType userType;
  Pool pool;
}

struct Pool {
  uint256 level;
  uint256 currentEra;
}

struct UserValidation {
  address validator;
  address user;
  string justification;
  uint256 majorityValidatorsCount;
  uint256 createdAtBlockNumber;
}

struct ResourceValidation {
  address validator;
  uint256 resourceId;
  string justification;
  uint256 majorityValidatorsCount;
  uint256 createdAtBlockNumber;
}

struct ContractsDependency {
  address userContractAddress;
  address producerContractAddress;
  address validatorPoolAddress;
  address inspectorContractAddress;
  address developerContractAddress;
}
