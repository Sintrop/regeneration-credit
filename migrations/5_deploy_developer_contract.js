const UserContract = artifacts.require("UserContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const DeveloperPool = artifacts.require("DeveloperPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const developerPool = await DeveloperPool.deployed();

    const developerContract = await deployer.deploy(DeveloperContract, userContract.address, developerPool.address);

    await developerPool.newAllowedCaller(developerContract.address);
    await userContract.newAllowedCaller(developerContract.address);
  });
};
