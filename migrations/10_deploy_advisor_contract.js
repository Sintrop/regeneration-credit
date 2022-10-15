const UserContract = artifacts.require("UserContract");
const AdvisorContract = artifacts.require("AdvisorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(AdvisorContract, userContract.address);
  });
};
