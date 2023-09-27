const RcToken = artifacts.require("RcToken");
const InspectorPool = artifacts.require("InspectorPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const pool_halving = process.env["INSPECTOR_POOL_HALVING"];
    const pool_total_eras = process.env["INSPECTOR_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["INSPECTOR_POOL_BLOCKS_PER_ERA"];

    await deployer.deploy(InspectorPool, rcToken.address, pool_halving, pool_total_eras, pool_blocks_per_era);
  });
};
