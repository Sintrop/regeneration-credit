const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function activistPoolDeploy() {
  const poolHalving = process.env["ACTIVIST_POOL_HALVING"];
  const poolTotalEras = process.env["ACTIVIST_POOL_TOTAL_ERAS"];
  const poolBlocksPerEra = process.env["ACTIVIST_POOL_BLOCKS_PER_ERA"];
  const activistPoolFunds = process.env["ACTIVIST_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const ActivistPool = await ethers.getContractFactory("ActivistPool");

  const activistPool = await ActivistPool.deploy(rcToken.target, poolHalving, poolTotalEras, poolBlocksPerEra);

  saveContractAddress("ActivistPool", activistPool.target);

  await rcToken.addContractPool(activistPool.target, activistPoolFunds);

  console.log(`ActivistPool address ${activistPool.target}`)

  return activistPool;
}

module.exports = activistPoolDeploy;
