const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function supporterPoolDeploy() {
  const rcToken = await getDeployedContract("RcToken");

  const supporterPoolFunds = 0;

  const SupporterPool = await ethers.getContractFactory("SupporterPool");

  const supporterPool = await SupporterPool.deploy(rcToken.target);

  saveContractAddress("SupporterPool", supporterPool.target);

  await rcToken.addContractPool(supporterPool.target, supporterPoolFunds);

  console.log(`SupporterPool address ${supporterPool.target}`)

  return supporterPool;
}

module.exports = supporterPoolDeploy;
