const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");
  const validationRules = await getDeployedContract("ValidationRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [communityRules.target, contributorPool.target, timeBetweenWorks, securityBlocksToValidatorAnalysis];

  const contributorRules = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorRules.target);

  await communityRules.newAllowedCaller(contributorRules.target);
  await contributorPool.newAllowedCaller(contributorRules.target);

  console.log(`ContributorRules address ${contributorRules.target}`);

  await verifyContract(contributorRules, "ContributorRules", args);

  return contributorRules;
}

module.exports = contributorRulesDeploy;