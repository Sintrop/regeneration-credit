const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const contributorMaxPenalties = process.env["CONTRIBUTOR_maxPenalties"];
  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_securityBlocksToValidation"];

  const args = [timeBetweenWorks, contributorMaxPenalties, securityBlocksToValidatorAnalysis];

  const contributorRules = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorRules.target);

  await communityRules.newAllowedCaller(contributorRules.target);
  await contributorPool.newAllowedCaller(contributorRules.target);
  // await contributorRules.newAllowedCaller(validationRules.target);

  console.log(`ContributorRules address ${contributorRules.target}`);

  await verifyContract(contributorRules, "ContributorRules", args);

  return contributorRules;
}

module.exports = contributorRulesDeploy;
