const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regeneratorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");

  const RegeneratorContract = await ethers.getContractFactory("RegeneratorContract");

  const args = [userContract.target, regeneratorPool.target];

  const regeneratorContract = await RegeneratorContract.deploy(...args);

  saveContractAddress("RegeneratorContract", regeneratorContract.target);

  await userContract.newAllowedCaller(regeneratorContract.target);
  await regeneratorPool.newAllowedCaller(regeneratorContract.target);

  console.log(`RegeneratorContract address ${regeneratorContract.target}`);

  await verifyContract(regeneratorContract, "RegeneratorContract", args);

  return regeneratorContract;
}

module.exports = regeneratorContractDeploy;
