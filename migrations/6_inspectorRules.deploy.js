const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorRulesDeploy() {
  const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

  const userRules = await getDeployedContract("UserRules");
  const inspectorPool = await getDeployedContract("InspectorPool");

  const InspectorRules = await ethers.getContractFactory("InspectorRules");

  const args = [userRules.target, inspectorPool.target, inspectorMaxPenalties];

  const inspectorRules = await InspectorRules.deploy(...args);

  saveContractAddress("InspectorRules", inspectorRules.target);

  await userRules.newAllowedCaller(inspectorRules.target);
  await inspectorPool.newAllowedCaller(inspectorRules.target);

  console.log(`InspectorRules address ${inspectorRules.target}`);

  await verifyContract(inspectorRules, "InspectorRules", args);

  return inspectorRules;
}

module.exports = inspectorRulesDeploy;
