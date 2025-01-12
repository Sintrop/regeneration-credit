const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function supporterContractDeploy() {
  const userContract = await getDeployedContract("UserRules");
  const supporterPool = await getDeployedContract("SupporterPool");

  const SupporterRules = await ethers.getContractFactory("SupporterRules");

  const args = [userContract.target, supporterPool.target];

  const supporterContract = await SupporterRules.deploy(...args);

  saveContractAddress("SupporterRules", supporterContract.target);

  await userContract.newAllowedCaller(supporterContract.target);
  await supporterPool.newAllowedCaller(supporterContract.target);

  console.log(`SupporterRules address ${supporterContract.target}`);

  await verifyContract(supporterContract, "SupporterRules", args);

  return supporterContract;
}

module.exports = supporterContractDeploy;
