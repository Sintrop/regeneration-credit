const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const developerPool = await getDeployedContract("DeveloperPool");
  const validatorRules = await getDeployedContract("ValidatorRules");

  const DeveloperRules = await ethers.getContractFactory("DeveloperRules");

  const developerMaxPenalties = process.env["DEVELOPER_MAX_PENALTIES"];
  const securityBlocksToValidatorAnalysis = process.env["DEVELOPER_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [
    communityRules.target,
    developerPool.target,
    validatorRules.target,
    developerMaxPenalties,
    securityBlocksToValidatorAnalysis,
  ];

  const developerRules = await DeveloperRules.deploy(...args);

  saveContractAddress("DeveloperRules", developerRules.target);

  await developerPool.newAllowedCaller(developerRules.target);
  await communityRules.newAllowedCaller(developerRules.target);
  await developerRules.newAllowedCaller(validatorRules.target);

  console.log(`DeveloperRules address ${developerRules.target}`);

  await verifyContract(developerRules, "DeveloperRules", args);

  return developerRules;
}

module.exports = developerRulesDeploy;
