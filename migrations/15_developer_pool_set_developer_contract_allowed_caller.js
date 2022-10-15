const DeveloperPool = artifacts.require("DeveloperPool");
const DeveloperContract = artifacts.require("DeveloperContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const developerPool = await DeveloperPool.deployed();
    const developerContract = await DeveloperContract.deployed();

    await developerPool.newAllowedCaller(developerContract.address);
  });
};
