const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];
  const poolDeployedAt = process.env["INSPECTOR_POOL_DEPLOYED_AT"] || 0;
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const InspectorPool = await ethers.getContractFactory("InspectorPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra, poolDeployedAt];

  const inspectorPool = await InspectorPool.deploy(...args);

  saveContractAddress("InspectorPool", inspectorPool.target);

  console.log(`InspectorPool address ${inspectorPool.target}`);

  await verifyContract(inspectorPool, "InspectorPool", args);

  return inspectorPool;
}

module.exports = inspectorPoolDeploy;
