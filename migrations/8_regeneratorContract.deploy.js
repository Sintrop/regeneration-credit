const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regeneratorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");

  const RegeneratorRules = await ethers.getContractFactory("RegeneratorRules");

  const args = [userContract.target, regeneratorPool.target];

  const regeneratorContract = await RegeneratorRules.deploy(...args);

  saveContractAddress("RegeneratorRules", regeneratorContract.target);

  await userContract.newAllowedCaller(regeneratorContract.target);
  await regeneratorPool.newAllowedCaller(regeneratorContract.target);

  console.log(`RegeneratorRules address ${regeneratorContract.target}`);

  await verifyContract(regeneratorContract, "RegeneratorRules", args);

  return regeneratorContract;
}

module.exports = regeneratorContractDeploy;
