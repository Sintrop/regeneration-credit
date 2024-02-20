const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function developerContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const developerPool = await getDeployedContract("DeveloperPool");

  const DeveloperContract = await ethers.getContractFactory("DeveloperContract");

  const developerContract = await DeveloperContract.deploy(userContract.target, developerPool.target);

  saveContractAddress("DeveloperContract", developerContract.target);

  await developerPool.newAllowedCaller(developerContract.target);
  await userContract.newAllowedCaller(developerContract.target);

  console.log(`DeveloperContract address ${developerContract.target}`)

  return developerContract;
}

module.exports = developerContractDeploy;
