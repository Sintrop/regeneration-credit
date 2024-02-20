const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function inspectorContractDeploy() {
  const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

  const userContract = await getDeployedContract("UserContract");
  const inspectorPool = await getDeployedContract("InspectorPool");

  const InspectorContract = await ethers.getContractFactory("InspectorContract");

  const inspectorContract = await InspectorContract.deploy(
    userContract.target,
    inspectorPool.target,
    inspectorMaxPenalties
  );

  saveContractAddress("InspectorContract", inspectorContract.target);

  await userContract.newAllowedCaller(inspectorContract.target);
  await inspectorPool.newAllowedCaller(inspectorContract.target);

  console.log(`InspectorContract address ${inspectorContract.target}`)

  return inspectorContract;
}

module.exports = inspectorContractDeploy;
