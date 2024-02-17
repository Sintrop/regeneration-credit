const saveContractAddress = require("./shared/saveContractAddress");
const contractAddress = require("./shared/readContractAddress");

async function developerPoolDeploy() {
  const pool_halving = process.env["DEVELOPER_POOL_HALVING"];
  const pool_total_eras = process.env["DEVELOPER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];

  const rcTokenAddress = contractAddress("RcToken");

  const DeveloperPool = await ethers.getContractFactory("DeveloperPool");

  const developerPool = await DeveloperPool.deploy(rcTokenAddress, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("DeveloperPool", developerPool.target);

  return developerPool;
}

module.exports = developerPoolDeploy;
