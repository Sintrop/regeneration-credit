const CategoryContract = artifacts.require("CategoryContract");
const IsaPool = artifacts.require("IsaPool");
const ResearcherContract = artifacts.require("ResearcherContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const isaPool = await IsaPool.deployed();
    const researcherContract = await ResearcherContract.deployed();

    await deployer.deploy(CategoryContract, isaPool.address, researcherContract.address);
  });
};
