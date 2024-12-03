const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validatorPoolDeploy() {
  const poolHalving = process.env["VALIDATOR_POOL_HALVING"];
  const poolBlocksPerEra = process.env["VALIDATOR_POOL_BLOCKS_PER_ERA"];
  const validatorPoolFunds = process.env["VALIDATOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ValidatorPool = await ethers.getContractFactory("ValidatorPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const validatorPool = await ValidatorPool.deploy(...args);

  saveContractAddress("ValidatorPool", validatorPool.target);

  await regenerationCredit.addContractPool(validatorPool.target, validatorPoolFunds);

  console.log(`ValidatorPool address ${validatorPool.target}`);

  await verifyContract(validatorPool, "ValidatorPool", args);

  return validatorPool;
}

module.exports = validatorPoolDeploy;
