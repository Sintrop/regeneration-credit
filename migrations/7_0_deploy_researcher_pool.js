const RctToken = artifacts.require("RctToken");
const ResearcherPool = artifacts.require("ResearcherPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rctToken = await RctToken.deployed();

    const pool_halving = process.env["RESEARCHER_POOL_HALVING"];
    const pool_total_eras = process.env["RESEARCHER_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["RESEARCHER_POOL_BLOCKS_PER_ERA"];

    await deployer.deploy(ResearcherPool, rctToken.address, pool_halving, pool_total_eras, pool_blocks_per_era);
  });
};
