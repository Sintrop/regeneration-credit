// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserTypes.sol";

struct Investor {
    uint256 id;
    address investorWallet;
    UserType userType;
    string name;
    string document;
    string documentType;
    InvestorAddress investorAddress;
}

struct InvestorAddress {
    string country;
    string state;
    string city;
    string cep;
}