const CategoryContract = artifacts.require("CategoryContract");
const IsaPool = artifacts.require("IsaPool");
const ResearcherContract = artifacts.require("ResearcherContract");
const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const isaPool = await IsaPool.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const userContract = await UserContract.deployed();

    await deployer.deploy(CategoryContract, isaPool.address, researcherContract.address, userContract.address);
  });
};
