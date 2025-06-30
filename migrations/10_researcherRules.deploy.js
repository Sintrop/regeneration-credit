const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const researcherPool = await getDeployedContract("ResearcherPool");

  const ResearcherRules = await ethers.getContractFactory("ResearcherRules");

  const timeBetweenWorks = process.env["TIME_BETWEEN_WORKS"];
  const researcherMaxPenalties = process.env["RESEARCHER_MAX_PENALTIES"];
  const securityBlocksToValidation_ = process.env["RESEARCHER_securityBlocksToValidation"];

  const args = [timeBetweenWorks, researcherMaxPenalties, securityBlocksToValidation_];

  const researcherRules = await ResearcherRules.deploy(...args);

  saveContractAddress("ResearcherRules", researcherRules.target);

  await communityRules.newAllowedCaller(researcherRules.target);
  await researcherPool.newAllowedCaller(researcherRules.target);

  console.log(`ReseacherContract address ${researcherRules.target}`);

  await verifyContract(researcherRules, "ResearcherRules", args);

  return researcherRules;
}

module.exports = researcherRulesDeploy;
