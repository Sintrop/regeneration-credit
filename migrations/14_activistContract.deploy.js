const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function activistContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const activistPool = await getDeployedContract("ActivistPool");

  const ActivistContract = await ethers.getContractFactory("ActivistContract");

  const activistContract = await ActivistContract.deploy(userContract.target, activistPool.target);

  saveContractAddress("ActivistContract", activistContract.target);

  await userContract.newAllowedCaller(activistContract.target);
  await activistPool.newAllowedCaller(activistContract.target);

  console.log(`ActivistContract address ${activistContract.target}`)

  return activistContract;
}

module.exports = activistContractDeploy;
