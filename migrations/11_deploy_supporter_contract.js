const UserContract = artifacts.require("UserContract");
const SupporterContract = artifacts.require("SupporterContract");
const SupporterPool = artifacts.require("SupporterPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const supporterPool = await SupporterPool.deployed();

    const supporterContract = await deployer.deploy(SupporterContract, userContract.address, supporterPool.address);

    await supporterPool.newAllowedCaller(supporterContract.address);
  });
};
