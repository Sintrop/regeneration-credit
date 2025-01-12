const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function activistContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const activistPool = await getDeployedContract("ActivistPool");

  const ActivistRules = await ethers.getContractFactory("ActivistRules");

  const args = [userContract.target, activistPool.target];

  const activistContract = await ActivistRules.deploy(...args);

  saveContractAddress("ActivistRules", activistContract.target);

  await userContract.newAllowedCaller(activistContract.target);
  await activistPool.newAllowedCaller(activistContract.target);

  console.log(`ActivistRules address ${activistContract.target}`);

  await verifyContract(activistContract, "ActivistRules", args);

  return activistContract;
}

module.exports = activistContractDeploy;
