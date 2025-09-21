const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regeneratorPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const RegeneratorPool = await ethers.getContractFactory("RegeneratorPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const regeneratorPool = await RegeneratorPool.deploy(...args);

  saveContractAddress("RegeneratorPool", regeneratorPool.target);

  console.log(`RegeneratorPool address ${regeneratorPool.target}`);

  await verifyContract(regeneratorPool, "RegeneratorPool", args);

  return regeneratorPool;
}

module.exports = regeneratorPoolDeploy;
