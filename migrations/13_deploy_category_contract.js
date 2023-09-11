const CategoryContract = artifacts.require("CategoryContract");
const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(CategoryContract, userContract.address);
  });
};