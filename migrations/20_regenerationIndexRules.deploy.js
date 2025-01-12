const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationIndexRulesDeploy() {
  const RegenerationIndexRules = await ethers.getContractFactory("RegenerationIndexRules");

  const regenerationIndexRules = await RegenerationIndexRules.deploy();

  saveContractAddress("RegenerationIndexRules", regenerationIndexRules.target);

  console.log(`RegenerationIndexRules address ${regenerationIndexRules.target}`);

  await verifyContract(regenerationIndexRules, "RegenerationIndexRules");

  return regenerationIndexRules;
}

module.exports = regenerationIndexRulesDeploy;
