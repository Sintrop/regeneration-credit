const RcToken = artifacts.require("RcToken");
const DeveloperPool = artifacts.require("DeveloperPool");

const pool_halving = process.env["DEVELOPER_POOL_HALVING"];
const pool_total_eras = process.env["DEVELOPER_POOL_TOTAL_ERAS"];
const pool_blocks_per_era = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];
const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const developerPool = await deployer.deploy(
      DeveloperPool,
      rcToken.address,
      pool_halving,
      pool_total_eras,
      pool_blocks_per_era
    );

    await rcToken.addContractPool(developerPool.address, developerPoolFunds);
  });
};
