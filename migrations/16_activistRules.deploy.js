const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function activistRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const activistPool = await getDeployedContract("ActivistPool");

  const ActivistRules = await ethers.getContractFactory("ActivistRules");

  const args = [communityRules.target, activistPool.target];

  const activistRules = await ActivistRules.deploy(...args);

  saveContractAddress("ActivistRules", activistRules.target);

  console.log(`ActivistRules address ${activistRules.target}`);

  await verifyContract(activistRules, "ActivistRules", args);

  return activistRules;
}

module.exports = activistRulesDeploy;
