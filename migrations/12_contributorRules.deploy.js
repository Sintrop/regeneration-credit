const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const contributorPool = await getDeployedContract("ContributorPool");
  const validationRules = await getDeployedContract("ValidationRules");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const contributorMaxPenalties = process.env["CONTRIBUTOR_MAX_PENALTIES"];  
  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [communityRules.target, contributorPool.target, validationRules.target, timeBetweenWorks, contributorMaxPenalties, securityBlocksToValidatorAnalysis];

  const contributorRules = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorRules.target);

  await communityRules.newAllowedCaller(contributorRules.target);
  await contributorPool.newAllowedCaller(contributorRules.target);
  await contributorRules.newAllowedCaller(validationRules.target);

  console.log(`ContributorRules address ${contributorRules.target}`);

  await verifyContract(contributorRules, "ContributorRules", args);

  return contributorRules;
}

module.exports = contributorRulesDeploy;