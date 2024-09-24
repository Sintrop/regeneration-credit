const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function activistContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const activistPool = await getDeployedContract("ActivistPool");

  const ActivistContract = await ethers.getContractFactory("ActivistContract");

  const args = [userContract.target, activistPool.target];

  const activistContract = await ActivistContract.deploy(...args);

  saveContractAddress("ActivistContract", activistContract.target);

  await userContract.newAllowedCaller(activistContract.target);
  await activistPool.newAllowedCaller(activistContract.target);

  console.log(`ActivistContract address ${activistContract.target}`);

  await verifyContract(activistContract.target, args);

  return activistContract;
}

module.exports = activistContractDeploy;
