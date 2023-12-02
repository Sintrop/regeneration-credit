// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { UserContract } from "./UserContract.sol";
import { ProducerContract } from "./ProducerContract.sol";
import { Validator, Validation } from "./types/ValidatorTypes.sol";
import { UserType } from "./types/UserTypes.sol";
import { Callable } from "./Callable.sol";

contract ValidatorContract is Callable {
  mapping(address => Validator) internal validators;
  mapping(address => Validation[]) private validations;

  UserContract internal userContract;
  ProducerContract internal producerContract;
  address[] internal validatorsAddress;
  uint256 public validatorsCount;

  constructor(address userContractAddress, address producerContractAddress) {
    userContract = UserContract(userContractAddress);
    producerContract = ProducerContract(producerContractAddress);
  }

  function addValidator() public {
    require(!validatorExists(msg.sender), "This validator already exist");

    uint256 id = validatorsCount + 1;
    UserType userType = UserType.VALIDATOR;

    validators[msg.sender] = Validator(id, msg.sender, userType);
    validatorsAddress.push(msg.sender);
    validatorsCount++;
    userContract.addUser(msg.sender, userType);
  }

  function addValidation(address userAddress, string memory justification) public {
    require(userContract.userTypeIs(UserType.VALIDATOR, msg.sender), "User must be a validator");
    require(!userContract.userTypeIs(UserType.DENIED, userAddress), "User already denied");

    uint256 majorityValidatorsCount_ = majorityValidatorsCount();
    uint256 validationsCount = validations[userAddress].length + 1;

    validations[userAddress].push(
      Validation(
        msg.sender,
        userAddress,
        0,
        justification,
        majorityValidatorsCount_,
        block.timestamp, // solhint-disable-line
        block.number
      )
    );

    if (validationsCount >= majorityValidatorsCount_) denieUser(userAddress);
  }

  function externalDenieUser(address userAddress) external mustBeAllowedCaller {
    denieUser(userAddress);
  }

  function externalRemoveLevels(address userAddress, uint256 levels) external mustBeAllowedCaller {
    resetLevels(userAddress, levels);
  }

  function denieUser(address userAddress) internal {
    resetLevels(userAddress, 0);

    userContract.setDeniedType(userAddress);
  }

  function resetLevels(address userAddress, uint256 levels) internal {
    UserType oldUserType = userContract.getUser(userAddress);

    if (oldUserType == UserType.PRODUCER) return producerContract.resetLevels(userAddress, levels);
  }

  function getValidations(address userAddress) public view returns (Validation[] memory) {
    return validations[userAddress];
  }

  function getValidators() public view returns (Validator[] memory) {
    Validator[] memory validatorList = new Validator[](validatorsCount);

    for (uint256 i = 0; i < validatorsCount; i++) {
      address acAddress = validatorsAddress[i];
      validatorList[i] = validators[acAddress];
    }

    return validatorList;
  }

  function getValidator(address addr) public view returns (Validator memory) {
    return validators[addr];
  }

  function validatorExists(address addr) public view returns (bool) {
    return validators[addr].id > 0;
  }

  function majorityValidatorsCount() public view returns (uint256) {
    return validatorsCount / 2;
  }
}
