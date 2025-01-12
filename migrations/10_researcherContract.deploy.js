const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const validatorContract = await getDeployedContract("ValidatorRules");

  const ResearcherRules = await ethers.getContractFactory("ResearcherRules");

  const timeBetweenWorks = process.env["RESEARCHER_TIME_BETWEEN_WORKS"];
  const researcherMaxPenalties = process.env["RESEARCHER_MAX_PENALTIES"];
  const securityBlocksToValidatorAnalysis = process.env["RESEARCHER_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [
    userContract.target,
    researcherPool.target,
    validatorContract.target,
    timeBetweenWorks,
    researcherMaxPenalties,
    securityBlocksToValidatorAnalysis,
  ];

  const researcherContract = await ResearcherRules.deploy(...args);

  saveContractAddress("ResearcherRules", researcherContract.target);

  await userContract.newAllowedCaller(researcherContract.target);
  await researcherPool.newAllowedCaller(researcherContract.target);
  await researcherContract.newAllowedCaller(validatorContract.target);

  console.log(`ReseacherContract address ${researcherContract.target}`);

  await verifyContract(researcherContract, "ResearcherRules", args);

  return researcherContract;
}

module.exports = researcherContractDeploy;
