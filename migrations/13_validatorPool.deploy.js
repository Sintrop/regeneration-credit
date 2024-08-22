const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function validatorPoolDeploy() {
  const pool_halving = process.env["VALIDATOR_POOL_HALVING"];
  const pool_total_eras = process.env["VALIDATOR_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["VALIDATOR_POOL_BLOCKS_PER_ERA"];
  const validatorPoolFunds = process.env["VALIDATOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ValidatorPool = await ethers.getContractFactory("ValidatorPool");

  const validatorPool = await ValidatorPool.deploy(regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("ValidatorPool", validatorPool.target);

  await regenerationCredit.addContractPool(validatorPool.target, validatorPoolFunds);

  console.log(`ValidatorPool address ${validatorPool.target}`)

  return validatorPool;
}

module.exports = validatorPoolDeploy;
