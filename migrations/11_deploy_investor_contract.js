const UserContract = artifacts.require("UserContract");
const InvestorContract = artifacts.require("InvestorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(InvestorContract, userContract.address);
  });
};
