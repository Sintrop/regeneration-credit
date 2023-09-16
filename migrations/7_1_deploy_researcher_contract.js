const UserContract = artifacts.require("UserContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ResearcherPool = artifacts.require("ResearcherPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const researcherPool = await ResearcherPool.deployed();
    const timeBetweenWorks = process.env["RESEARCHER_TIME_BETWEEN_WORKS"];

    const researcherContract = await deployer.deploy(ResearcherContract, userContract.address, researcherPool.address, timeBetweenWorks);

    await researcherPool.newAllowedCaller(researcherContract.address);
  });
};