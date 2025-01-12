const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function activistRulesDeploy() {
  const userRules = await getDeployedContract("UserRules");
  const activistPool = await getDeployedContract("ActivistPool");

  const ActivistRules = await ethers.getContractFactory("ActivistRules");

  const args = [userRules.target, activistPool.target];

  const activistRules = await ActivistRules.deploy(...args);

  saveContractAddress("ActivistRules", activistRules.target);

  await userRules.newAllowedCaller(activistRules.target);
  await activistPool.newAllowedCaller(activistRules.target);

  console.log(`ActivistRules address ${activistRules.target}`);

  await verifyContract(activistRules, "ActivistRules", args);

  return activistRules;
}

module.exports = activistRulesDeploy;
