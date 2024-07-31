const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function supporterContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const supporterPool = await getDeployedContract("SupporterPool");

  const SupporterContract = await ethers.getContractFactory("SupporterContract");

  const supporterContract = await SupporterContract.deploy(userContract.target, supporterPool.target);

  saveContractAddress("SupporterContract", supporterContract.target);

  await userContract.newAllowedCaller(supporterContract.target);
  await supporterPool.newAllowedCaller(supporterContract.target);

  console.log(`SupporterContract address ${supporterContract.target}`)

  return supporterContract;
}

module.exports = supporterContractDeploy;
