const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function validatorPoolDeploy() {
  const pool_halving = process.env["VALIDATOR_POOL_HALVING"];
  const pool_total_eras = process.env["VALIDATOR_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["VALIDATOR_POOL_BLOCKS_PER_ERA"];
  const validatorPoolFunds = process.env["VALIDATOR_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const ValidatorPool = await ethers.getContractFactory("ValidatorPool");

  const validatorPool = await ValidatorPool.deploy(rcToken.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("ValidatorPool", validatorPool.target);

  await rcToken.addContractPool(validatorPool.target, validatorPoolFunds);

  console.log(`ValidatorPool address ${validatorPool.target}`)

  return validatorPool;
}

module.exports = validatorPoolDeploy;
