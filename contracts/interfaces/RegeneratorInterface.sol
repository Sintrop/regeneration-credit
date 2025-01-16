// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

interface RegeneratorInterface {
  struct Regenerator {
    uint256 id;
    address regeneratorWallet;
    UserType userType;
    string name;
    string document;
    string documentType;
    bool pendingInspection;
    uint256 totalRequests;
    int256 regenerationScore;
    TokenApprove tokenApprove;
    AreaInformation areaInformation;
  }

  enum UserType {
    REGENERATOR,
    INSPECTOR,
    RESEARCHER,
    DEVELOPER,
    ADVISOR,
    ACTIVIST,
    SUPPORTER
  }

  struct TokenApprove {
    uint256 allowed;
    bool withdrewToken;
  }

  struct AreaInformation {
    string country;
    string state;
    string city;
    string cep;
  }

  function addUser(address addr, UserType userType) external;
}
