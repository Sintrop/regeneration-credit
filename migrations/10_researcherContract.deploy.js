const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function researcherContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const researcherPool = await getDeployedContract("ResearcherPool");

  const ResearcherContract = await ethers.getContractFactory("ResearcherContract");

  const timeBetweenWorks = process.env["RESEARCHER_TIME_BETWEEN_WORKS"];

  const researcherContract = await ResearcherContract.deploy(
    userContract.target,
    researcherPool.target,
    timeBetweenWorks
  );

  saveContractAddress("ResearcherContract", researcherContract.target);

  await userContract.newAllowedCaller(researcherContract.target);
  await researcherPool.newAllowedCaller(researcherContract.target);

  return researcherContract;
}

module.exports = researcherContractDeploy;
