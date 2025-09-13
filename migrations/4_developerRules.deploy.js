const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const developerPool = await getDeployedContract("DeveloperPool");

  const DeveloperRules = await ethers.getContractFactory("DeveloperRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const developerMaxPenalties = process.env["MAX_PENALTIES"];
  const securityBlocksToValidation_ = process.env["SECURITY_BLOCKS_TO_VALIDATION"];

  const args = [timeBetweenWorks, developerMaxPenalties, securityBlocksToValidation_];

  const developerRules = await DeveloperRules.deploy(...args);

  saveContractAddress("DeveloperRules", developerRules.target);

  console.log(`DeveloperRules address ${developerRules.target}`);

  await verifyContract(developerRules, "DeveloperRules", args);

  return developerRules;
}

module.exports = developerRulesDeploy;
