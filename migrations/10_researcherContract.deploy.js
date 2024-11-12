const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const validatorContract = await getDeployedContract("ValidatorContract");

  const ResearcherContract = await ethers.getContractFactory("ResearcherContract");

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

  const researcherContract = await ResearcherContract.deploy(...args);

  saveContractAddress("ResearcherContract", researcherContract.target);

  await userContract.newAllowedCaller(researcherContract.target);
  await researcherPool.newAllowedCaller(researcherContract.target);
  await researcherContract.newAllowedCaller(validatorContract.target);

  console.log(`ReseacherContract address ${researcherContract.target}`);

  await verifyContract(researcherContract, "ResearcherContract", args);

  return researcherContract;
}

module.exports = researcherContractDeploy;
