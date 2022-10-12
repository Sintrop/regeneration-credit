const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");
const DeveloperPool = artifacts.require("DeveloperPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const sacToken = await SacToken.deployed();
    const isaPool = await IsaPool.deployed();
    const developerPool = await DeveloperPool.deployed();

    await sacToken.addContractPool(isaPool.address, 0)
    await sacToken.addContractPool(developerPool.address, "15000000000000000000000000");
  });
};
