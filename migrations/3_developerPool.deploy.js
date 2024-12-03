const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerPoolDeploy() {
  const poolHalving = process.env["DEVELOPER_POOL_HALVING"];
  const poolBlocksPerEra = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];
  const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const DeveloperPool = await ethers.getContractFactory("DeveloperPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const developerPool = await DeveloperPool.deploy(...args);

  saveContractAddress("DeveloperPool", developerPool.target);

  await regenerationCredit.addContractPool(developerPool.target, developerPoolFunds);

  console.log(`DeveloperPool address ${developerPool.target}`);

  await verifyContract(developerPool, "DeveloperPool", args);

  return developerPool;
}

module.exports = developerPoolDeploy;
