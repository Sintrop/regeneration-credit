const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const validatorRules = await getDeployedContract("ValidatorRules");

  const ResearcherRules = await ethers.getContractFactory("ResearcherRules");

  const timeBetweenResearches = process.env["RESEARCHER_TIME_BETWEEN_RESEARCHES"];
  const researcherMaxPenalties = process.env["RESEARCHER_MAX_PENALTIES"];
  const securityBlocksToValidatorAnalysis = process.env["RESEARCHER_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [
    communityRules.target,
    researcherPool.target,
    validatorRules.target,
    timeBetweenResearches,
    researcherMaxPenalties,
    securityBlocksToValidatorAnalysis,
  ];

  const researcherRules = await ResearcherRules.deploy(...args);

  saveContractAddress("ResearcherRules", researcherRules.target);

  await communityRules.newAllowedCaller(researcherRules.target);
  await researcherPool.newAllowedCaller(researcherRules.target);
  await researcherRules.newAllowedCaller(validatorRules.target);

  console.log(`ReseacherContract address ${researcherRules.target}`);

  await verifyContract(researcherRules, "ResearcherRules", args);

  return researcherRules;
}

module.exports = researcherRulesDeploy;
