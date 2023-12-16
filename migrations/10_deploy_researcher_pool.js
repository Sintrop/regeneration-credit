const RcToken = artifacts.require("RcToken");
const ResearcherPool = artifacts.require("ResearcherPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const pool_halving = process.env["RESEARCHER_POOL_HALVING"];
    const pool_total_eras = process.env["RESEARCHER_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["RESEARCHER_POOL_BLOCKS_PER_ERA"];
    const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];

    const researcherPool = await deployer.deploy(
      ResearcherPool,
      rcToken.address,
      pool_halving,
      pool_total_eras,
      pool_blocks_per_era
    );

    await rcToken.addContractPool(researcherPool.address, researcherPoolFunds);
  });
};
