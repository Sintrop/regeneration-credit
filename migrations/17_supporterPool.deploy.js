const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function supporterPoolDeploy() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const supporterPoolFunds = 0;

  const SupporterPool = await ethers.getContractFactory("SupporterPool");

  const args = [regenerationCredit.target];

  const supporterPool = await SupporterPool.deploy(...args);

  saveContractAddress("SupporterPool", supporterPool.target);

  await regenerationCredit.addContractPool(supporterPool.target, supporterPoolFunds);

  console.log(`SupporterPool address ${supporterPool.target}`);

  await verifyContract(supporterPool, "SupporterPool", args);

  return supporterPool;
}

module.exports = supporterPoolDeploy;
