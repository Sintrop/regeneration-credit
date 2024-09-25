const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function supporterContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const supporterPool = await getDeployedContract("SupporterPool");

  const SupporterContract = await ethers.getContractFactory("SupporterContract");

  const args = [userContract.target, supporterPool.target];

  const supporterContract = await SupporterContract.deploy(...args);

  saveContractAddress("SupporterContract", supporterContract.target);

  await userContract.newAllowedCaller(supporterContract.target);
  await supporterPool.newAllowedCaller(supporterContract.target);

  console.log(`SupporterContract address ${supporterContract.target}`);

  await verifyContract(supporterContract, "SupporterContract", args);

  return supporterContract;
}

module.exports = supporterContractDeploy;
