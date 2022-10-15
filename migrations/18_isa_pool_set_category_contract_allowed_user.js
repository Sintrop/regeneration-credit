const IsaPool = artifacts.require("IsaPool");
const CategoryContract = artifacts.require("CategoryContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const isaPool = await IsaPool.deployed();
    const categoryContract = await CategoryContract.deployed();

    await isaPool.newAllowedCaller(categoryContract.address);
  });
};
