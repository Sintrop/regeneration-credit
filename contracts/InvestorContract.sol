// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./UserContract.sol";
import "./types/InvestorTypes.sol";

contract InvestorContract {
    mapping(address => Investor) internal investors;

    UserContract internal userContract;
    address[] internal investorsAddress;
    uint256 public investorsCount;

    constructor(address userContractAddress) {
        userContract = UserContract(userContractAddress);
    }

    /**
     * @dev Allow a new register of investor
     * @param name the name of the investor
     * @param document the document of investor
     * @param documentType the document type type of investor. CPF/CNPJ
     * @param country the country where the investor is
     * @param state the state of the investor
     * @param city the of the investor
     * @param cep the cep of the investor
     * @return a investor
     */
    function addInvestor(
        string memory name,
        string memory document,
        string memory documentType,
        string memory country,
        string memory state,
        string memory city,
        string memory cep
    ) public uniqueInvestor returns (Investor memory) {
        uint256 id = investorsCount + 1;
        UserType userType = UserType.INVESTOR;

        InvestorAddress memory investorAddress = InvestorAddress(country, state, city, cep);

        Investor memory investor = Investor(
            id,
            msg.sender,
            userType,
            name,
            document,
            documentType,
            investorAddress
        );

        investors[msg.sender] = investor;
        investorsAddress.push(msg.sender);
        investorsCount++;
        userContract.addUser(msg.sender, userType);

        return investor;
    }

    /**
     * @dev Returns all registered investors
     * @return Investor struct array
     */
    function getInvestors() public view returns (Investor[] memory) {
        Investor[] memory investorList = new Investor[](investorsCount);

        for (uint256 i = 0; i < investorsCount; i++) {
            address acAddress = investorsAddress[i];
            investorList[i] = investors[acAddress];
        }

        return investorList;
    }

    /**
     * @dev Return a specific investor
     * @param addr the address of the investor.
     */
    function getInvestor(address addr) public view returns (Investor memory) {
        return investors[addr];
    }

    /**
     * @dev Check if a specific investor exists
     * @return a bool that represent if a investor exists or not
     */
    function investorExists(address addr) public view returns (bool) {
        return bytes(investors[addr].name).length > 0;
    }

    //MODIFIERS

    modifier uniqueInvestor() {
        require(!investorExists(msg.sender), "This investor already exist");
        _;
    }
}
