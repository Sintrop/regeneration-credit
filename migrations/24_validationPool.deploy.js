const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validationPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];
  const validationPoolFunds = process.env["VALIDATION_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ValidationPool = await ethers.getContractFactory("ValidationPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const validationPool = await ValidationPool.deploy(...args);

  saveContractAddress("ValidationPool", validationPool.target);

  console.log(`ValidationPool address ${validationPool.target}`);

  await verifyContract(validationPool, "ValidationPool", args);

  return validationPool;
}

module.exports = validationPoolDeploy;