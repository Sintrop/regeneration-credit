const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function activistPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];
  // const activistPoolFunds = process.env["ACTIVIST_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ActivistPool = await ethers.getContractFactory("ActivistPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const activistPool = await ActivistPool.deploy(...args);

  saveContractAddress("ActivistPool", activistPool.target);

  // await regenerationCredit.addContractPool(activistPool.target, activistPoolFunds);

  console.log(`ActivistPool address ${activistPool.target}`);

  await verifyContract(activistPool, "ActivistPool", args);

  return activistPool;
}

module.exports = activistPoolDeploy;
