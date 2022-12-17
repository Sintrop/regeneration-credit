const UserContract = artifacts.require("UserContract");
const InvestorContract = artifacts.require("InvestorContract");
const SacToken = artifacts.require("SacToken");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const sacToken = await SacToken.deployed();

    await deployer.deploy(InvestorContract, userContract.address, sacToken.address);
  });
};
