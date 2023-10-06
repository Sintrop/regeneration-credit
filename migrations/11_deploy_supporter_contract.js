const UserContract = artifacts.require("UserContract");
const SupporterContract = artifacts.require("SupporterContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(SupporterContract, userContract.address);
  });
};
