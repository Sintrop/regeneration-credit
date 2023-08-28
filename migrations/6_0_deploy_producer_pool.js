const RcToken = artifacts.require("RcToken");
const ProducerPool = artifacts.require("ProducerPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const producer_pool_halving = process.env["PRODUCER_POOL_HALVING"];
    const producer_pool_total_eras = process.env["PRODUCER_POOL_TOTAL_ERAS"];
    const producer_pool_blocks_per_era = process.env["PRODUCER_POOL_BLOCKS_PER_ERA"];

    await deployer.deploy(
      ProducerPool,
      rcToken.address,
      producer_pool_halving,
      producer_pool_total_eras,
      producer_pool_blocks_per_era
    );
  });
};
