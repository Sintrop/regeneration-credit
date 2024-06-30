const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function researcherContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const validatorContract = await getDeployedContract("ValidatorContract");

  const ResearcherContract = await ethers.getContractFactory("ResearcherContract");

  const timeBetweenWorks = process.env["RESEARCHER_TIME_BETWEEN_WORKS"];
  const researcherMaxPenalties = process.env["DEVELOPER_MAX_PENALTIES"];

  const researcherContract = await ResearcherContract.deploy(
    userContract.target,
    researcherPool.target,
    validatorContract.target,
    timeBetweenWorks,
    researcherMaxPenalties
  );

  saveContractAddress("ResearcherContract", researcherContract.target);

  await userContract.newAllowedCaller(researcherContract.target);
  await researcherPool.newAllowedCaller(researcherContract.target);
  await researcherContract.newAllowedCaller(validatorContract.target);

  console.log(`ReseacherContract address ${researcherContract.target}`);

  return researcherContract;
}

module.exports = researcherContractDeploy;
