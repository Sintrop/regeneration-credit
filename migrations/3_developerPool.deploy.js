const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerPoolDeploy() {
  const pool_halving = process.env["DEVELOPER_POOL_HALVING"];
  const pool_total_eras = process.env["DEVELOPER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];
  const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const DeveloperPool = await ethers.getContractFactory("DeveloperPool");

  const args = [regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era];

  const developerPool = await DeveloperPool.deploy(...args);

  saveContractAddress("DeveloperPool", developerPool.target);

  await regenerationCredit.addContractPool(developerPool.target, developerPoolFunds);

  console.log(`DeveloperPool address ${developerPool.target}`);

  await verifyContract(developerPool.target, args);

  return developerPool;
}

module.exports = developerPoolDeploy;
