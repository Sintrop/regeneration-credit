const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function developerPoolDeploy() {
  const pool_halving = process.env["DEVELOPER_POOL_HALVING"];
  const pool_total_eras = process.env["DEVELOPER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];
  const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const DeveloperPool = await ethers.getContractFactory("DeveloperPool");

  const developerPool = await DeveloperPool.deploy(rcToken.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("DeveloperPool", developerPool.target);

  await rcToken.addContractPool(developerPool.target, developerPoolFunds);

  return developerPool;
}

module.exports = developerPoolDeploy;
