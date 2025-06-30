const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorRulesDeploy() {
  const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

  const communityRules = await getDeployedContract("CommunityRules");
  const inspectorPool = await getDeployedContract("InspectorPool");

  const InspectorRules = await ethers.getContractFactory("InspectorRules");

  const args = [communityRules.target, inspectorPool.target, inspectorMaxPenalties];

  const inspectorRules = await InspectorRules.deploy(...args);

  saveContractAddress("InspectorRules", inspectorRules.target);

  await communityRules.newAllowedCaller(inspectorRules.target);
  await inspectorPool.newAllowedCaller(inspectorRules.target);

  console.log(`InspectorRules address ${inspectorRules.target}`);

  await verifyContract(inspectorRules, "InspectorRules", args);

  return inspectorRules;
}

module.exports = inspectorRulesDeploy;
