// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserType } from "./UserTypes.sol";

struct Validator {
  uint256 id;
  address validatorWallet;
  UserType userType;
}

struct Validation {
  address validator;
  address user;
  uint256 resourceId;
  string justification;
  uint256 majorityValidatorsCount;
  uint256 createdAtTimeStamp;
  uint256 createdAtBlockNumber;
}
