const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const contributorMaxPenalties = process.env["MAX_PENALTIES"];
  const securityBlocksToValidation_ = process.env["SECURITY_BLOCKS_TO_VALIDATION"];

  const args = [timeBetweenWorks, contributorMaxPenalties, securityBlocksToValidation_];

  const contributorRules = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorRules.target);

  console.log(`ContributorRules address ${contributorRules.target}`);

  await verifyContract(contributorRules, "ContributorRules", args);

  return contributorRules;
}

module.exports = contributorRulesDeploy;
