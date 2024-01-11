const RcToken = artifacts.require("RcToken");
const ValidatorPool = artifacts.require("ValidatorPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const pool_halving = process.env["VALIDATOR_POOL_HALVING"];
    const pool_total_eras = process.env["VALIDATOR_POOL_TOTAL_ERAS"];
    const pool_blocks_per_era = process.env["VALIDATOR_POOL_BLOCKS_PER_ERA"];
    const validatorPoolFunds = process.env["VALIDATOR_POOL_FUNDS"];


    await deployer.deploy(ValidatorPool, rcToken.address, pool_halving, pool_total_eras, pool_blocks_per_era);

    await rcToken.addContractPool(ValidatorPool.address, validatorPoolFunds);

  });
};
