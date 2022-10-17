const UserContract = artifacts.require("UserContract");
const ContributorContract = artifacts.require("ContributorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(ContributorContract, userContract.address);
  });
};
