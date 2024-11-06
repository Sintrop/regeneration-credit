// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { UserType, Delation, Invitation, UserTypeSetting } from "./types/UserTypes.sol";
import { Callable } from "./Callable.sol";

/**
 * @author Sintrop
 * @title UserContract
 * @dev Users registration system
 */
contract UserContract is Ownable, Callable {
  mapping(address => UserType) internal users;
  mapping(address => Delation[]) private delations;
  mapping(address => Invitation) public invitations;
  mapping(UserType => uint256) public userTypesCount;
  mapping(UserType => UserTypeSetting) public userTypeSettings;

  uint256 public delationsCount;
  uint256 public usersCount;

  constructor(
    uint256 inspectorProportionality,
    uint256 activistProportionality,
    uint256 researcherProportionality,
    uint256 developerProportionality,
    uint256 validatorProportionality,
    uint256 contributorProportionality
  ) {
    userTypeSettings[UserType.PRODUCER] = UserTypeSetting(0, false, true, 0);
    userTypeSettings[UserType.INSPECTOR] = UserTypeSetting(inspectorProportionality, true, true, 0);
    userTypeSettings[UserType.ACTIVIST] = UserTypeSetting(activistProportionality, false, true, 100000);
    userTypeSettings[UserType.RESEARCHER] = UserTypeSetting(researcherProportionality, false, true, 200000);
    userTypeSettings[UserType.DEVELOPER] = UserTypeSetting(developerProportionality, false, true, 200000);
    userTypeSettings[UserType.CONTRIBUTOR] = UserTypeSetting(contributorProportionality, false, true, 100000);
    userTypeSettings[UserType.VALIDATOR] = UserTypeSetting(validatorProportionality, false, true, 1000000);
  }

  /**
   * @dev Add new user in the system
   * @param addr The address of the user
   * @param userType The type of the user - enum UserType
   */
  function addUser(address addr, UserType userType) public mustBeAllowedCaller {
    require(users[addr] == UserType.UNDEFINED, "User already exists");
    require(userType != UserType.UNDEFINED, "Invalid user type");
    require(registrationProportionalityAllowed(userType), "Proportionality invalid");
    require(invitedTypeOnRegister(addr, userType), "Invalid invitation");

    users[addr] = userType;
    usersCount++;
    userTypesCount[userType]++;
  }

  function invitedTypeOnRegister(address addr, UserType userType) internal view returns (bool) {
    if (!userTypeSettings[userType].needInvitationOnRegister) return true;

    Invitation memory invitation = invitations[addr];

    return invitation.createdAtBlock > 0 && invitation.userType == userType;
  }

  function registrationProportionalityAllowed(UserType userType) internal view returns (bool) {
    uint256 producersCount = userTypesCount[UserType.PRODUCER];
    uint256 registeredUserTypeCount = userTypesCount[userType];
    UserTypeSetting memory setting = userTypeSettings[userType];
    uint256 proportionality = setting.proportionalityOnRegister;

    if (proportionality == 0) return true;

    if (setting.directProportionalityRegistration) return registeredUserTypeCount < producersCount * proportionality;
    return registeredUserTypeCount < producersCount / proportionality;
  }

  function getUser(address addr) public view returns (UserType) {
    return users[addr];
  }

  function getUserTypeSettings(UserType userType) public view returns (UserTypeSetting memory) {
    return userTypeSettings[userType];
  }

  /**
   * @dev Add new delation in the system
   * @param addr The address of the user
   * @param title Title the delation
   * @param testimony Content the delation
   */
  function addDelation(address addr, string memory title, string memory testimony) public {
    require(users[msg.sender] != UserType.UNDEFINED, "Caller must be registered");
    require(users[addr] != UserType.UNDEFINED, "User must be registered");

    delations[addr].push(Delation(delationsCount + 1, msg.sender, addr, title, testimony));
    delationsCount++;
  }

  function addInvitation(address inviter, address invited, UserType userType) public mustBeAllowedCaller {
    require(invitations[invited].invited == address(0), "Already invited");
    require(users[invited] == UserType.UNDEFINED, "Already registered");

    invitations[invited] = Invitation(invited, inviter, userType, block.number);
  }

  function setDeniedType(address userAddress) public mustBeAllowedCaller {
    users[userAddress] = UserType.DENIED;
  }

  function userTypeIs(UserType userType, address userAddress) public view returns (bool) {
    return users[userAddress] == userType;
  }

  /**
   * @dev Returns the user address delated
   */
  function getUserDelations(address addr) public view returns (Delation[] memory) {
    return delations[addr];
  }

  function getInvitation(address addr) public view returns (Invitation memory) {
    return invitations[addr];
  }
}
