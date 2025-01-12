const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorContractDeploy() {
  const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

  const userContract = await getDeployedContract("UserContract");
  const inspectorPool = await getDeployedContract("InspectorPool");

  const InspectorRules = await ethers.getContractFactory("InspectorRules");

  const args = [userContract.target, inspectorPool.target, inspectorMaxPenalties];

  const inspectorContract = await InspectorRules.deploy(...args);

  saveContractAddress("InspectorRules", inspectorContract.target);

  await userContract.newAllowedCaller(inspectorContract.target);
  await inspectorPool.newAllowedCaller(inspectorContract.target);

  console.log(`InspectorRules address ${inspectorContract.target}`);

  await verifyContract(inspectorContract, "InspectorRules", args);

  return inspectorContract;
}

module.exports = inspectorContractDeploy;
