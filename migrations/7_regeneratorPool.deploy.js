const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regeneratorPoolDeploy() {
  const poolHalving = process.env["REGENERATOR_POOL_HALVING"];
  const poolBlocksPerEra = process.env["REGENERATOR_POOL_BLOCKS_PER_ERA"];
  const regeneratorPoolFunds = process.env["REGENERATOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const RegeneratorPool = await ethers.getContractFactory("RegeneratorPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const regeneratorPool = await RegeneratorPool.deploy(...args);

  saveContractAddress("RegeneratorPool", regeneratorPool.target);

  await regenerationCredit.addContractPool(regeneratorPool.target, regeneratorPoolFunds);

  console.log(`RegeneratorPool address ${regeneratorPool.target}`);

  await verifyContract(regeneratorPool, "RegeneratorPool", args);

  return regeneratorPool;
}

module.exports = regeneratorPoolDeploy;
