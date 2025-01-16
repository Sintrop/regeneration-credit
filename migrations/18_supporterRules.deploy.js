const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function supporterRulesDeploy() {
  const userRules = await getDeployedContract("UserRules");
  const supporterPool = await getDeployedContract("SupporterPool");

  const SupporterRules = await ethers.getContractFactory("SupporterRules");

  const args = [userRules.target, supporterPool.target];

  const supporterRules = await SupporterRules.deploy(...args);

  saveContractAddress("SupporterRules", supporterRules.target);

  await userRules.newAllowedCaller(supporterRules.target);
  await supporterPool.newAllowedCaller(supporterRules.target);

  console.log(`SupporterRules address ${supporterRules.target}`);

  await verifyContract(supporterRules, "SupporterRules", args);

  return supporterRules;
}

module.exports = supporterRulesDeploy;
