const RcToken = artifacts.require("RcToken");
const ActivistPool = artifacts.require("ActivistPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const pool_halving = process.env["ACTIVIST_POOL_HALVING"];
    const pool_total_eras = process.env["ACTIVIST_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["ACTIVIST_POOL_BLOCKS_PER_ERA"];
    const activistPoolFunds = process.env["ACTIVIST_POOL_FUNDS"];


    await deployer.deploy(ActivistPool, rcToken.address, pool_halving, pool_total_eras, pool_blocks_per_era);

    await rcToken.addContractPool(ActivistPool.address, activistPoolFunds);

  });
};
