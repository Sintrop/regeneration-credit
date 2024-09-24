const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorPoolDeploy() {
  const pool_halving = process.env["INSPECTOR_POOL_HALVING"];
  const pool_total_eras = process.env["INSPECTOR_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["INSPECTOR_POOL_BLOCKS_PER_ERA"];
  const inspectorPoolFunds = process.env["INSPECTOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const InspectorPool = await ethers.getContractFactory("InspectorPool");

  const args = [regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era];

  const inspectorPool = await InspectorPool.deploy(...args);

  saveContractAddress("InspectorPool", inspectorPool.target);

  await regenerationCredit.addContractPool(inspectorPool.target, inspectorPoolFunds);

  console.log(`InspectorPool address ${inspectorPool.target}`);

  await verifyContract(inspectorPool.target, args);

  return inspectorPool;
}

module.exports = inspectorPoolDeploy;
