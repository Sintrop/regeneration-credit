const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regeneratorRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");

  const RegeneratorRules = await ethers.getContractFactory("RegeneratorRules");

  const args = [communityRules.target, regeneratorPool.target];

  const regeneratorRules = await RegeneratorRules.deploy(...args);

  saveContractAddress("RegeneratorRules", regeneratorRules.target);

  await communityRules.newAllowedCaller(regeneratorRules.target);
  await regeneratorPool.newAllowedCaller(regeneratorRules.target);

  console.log(`RegeneratorRules address ${regeneratorRules.target}`);

  await verifyContract(regeneratorRules, "RegeneratorRules", args);

  return regeneratorRules;
}

module.exports = regeneratorRulesDeploy;
