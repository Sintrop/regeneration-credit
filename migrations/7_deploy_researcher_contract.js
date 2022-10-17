const UserContract = artifacts.require("UserContract");
const ResearcherContract = artifacts.require("ResearcherContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(ResearcherContract, userContract.address);
  });
};
