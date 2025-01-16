const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorRulesDeploy() {
  const userRules = await getDeployedContract("UserRules");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");

  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [userRules.target, contributorPool.target, securityBlocksToValidatorAnalysis];

  const contributorRules = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorRules.target);

  await userRules.newAllowedCaller(contributorRules.target);
  await contributorRules.newAllowedCaller(contributorPool.target);

  console.log(`ContributorRules address ${contributorRules.target}`);

  await verifyContract(contributorRules, "ContributorRules", args);

  return contributorRules;
}

module.exports = contributorRulesDeploy;
