const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function inspectorPoolDeploy() {
  const pool_halving = process.env["INSPECTOR_POOL_HALVING"];
  const pool_total_eras = process.env["INSPECTOR_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["INSPECTOR_POOL_BLOCKS_PER_ERA"];
  const inspectorPoolFunds = process.env["INSPECTOR_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const InspectorPool = await ethers.getContractFactory("InspectorPool");

  const inspectorPool = await InspectorPool.deploy(rcToken.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("InspectorPool", inspectorPool.target);

  await rcToken.addContractPool(inspectorPool.target, inspectorPoolFunds);

  console.log(`InspectorPool address ${inspectorPool.target}`)

  return inspectorPool;
}

module.exports = inspectorPoolDeploy;
