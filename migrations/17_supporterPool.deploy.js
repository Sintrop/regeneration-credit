const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function supporterPoolDeploy() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const supporterPoolFunds = 0;

  const SupporterPool = await ethers.getContractFactory("SupporterPool");

  const supporterPool = await SupporterPool.deploy(regenerationCredit.target);

  saveContractAddress("SupporterPool", supporterPool.target);

  await regenerationCredit.addContractPool(supporterPool.target, supporterPoolFunds);

  console.log(`SupporterPool address ${supporterPool.target}`)

  return supporterPool;
}

module.exports = supporterPoolDeploy;
