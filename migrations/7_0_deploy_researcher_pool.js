const SacToken = artifacts.require("SacToken");
const ResearcherPool = artifacts.require("ResearcherPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const sacToken = await SacToken.deployed();

    const pool_halving = process.env["RESEARCHER_POOL_HALVING"];
    const pool_total_eras = process.env["RESEARCHER_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["RESEARCHER_POOL_BLOCKS_PER_ERA"];

    await deployer.deploy(ResearcherPool, sacToken.address, pool_halving, pool_total_eras, pool_blocks_per_era);
  });
};
