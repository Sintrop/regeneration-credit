const UserContract = artifacts.require("UserContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ResearcherPool = artifacts.require("ResearcherPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const researcherPool = await ResearcherPool.deployed();

    await deployer.deploy(ResearcherContract, userContract.address, researcherPool.address);
  });
};
