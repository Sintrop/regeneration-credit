const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");
const DeveloperPool = artifacts.require("DeveloperPool");

const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];
const isaPoolFunds = process.env["ISA_POOL_FUNDS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const sacToken = await SacToken.deployed();
    const isaPool = await IsaPool.deployed();
    const developerPool = await DeveloperPool.deployed();

    await sacToken.addContractPool(isaPool.address, isaPoolFunds)
    await sacToken.addContractPool(developerPool.address, developerPoolFunds);
  });
};
