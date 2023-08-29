const CategoryContract = artifacts.require("CategoryContract");
const IsaPool = artifacts.require("IsaPool");
const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const isaPool = await IsaPool.deployed();
    const userContract = await UserContract.deployed();

    await deployer.deploy(CategoryContract, isaPool.address, userContract.address);
  });
};
