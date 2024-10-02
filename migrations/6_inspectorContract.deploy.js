const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectorContractDeploy() {
  const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

  const userContract = await getDeployedContract("UserContract");
  const inspectorPool = await getDeployedContract("InspectorPool");

  const InspectorContract = await ethers.getContractFactory("InspectorContract");

  const args = [userContract.target, inspectorPool.target, inspectorMaxPenalties];

  const inspectorContract = await InspectorContract.deploy(...args);

  saveContractAddress("InspectorContract", inspectorContract.target);

  await userContract.newAllowedCaller(inspectorContract.target);
  await inspectorPool.newAllowedCaller(inspectorContract.target);

  console.log(`InspectorContract address ${inspectorContract.target}`);

  await verifyContract(inspectorContract, "InspectorContract", args);

  return inspectorContract;
}

module.exports = inspectorContractDeploy;
