const RctToken = artifacts.require("RctToken");
const IsaPool = artifacts.require("IsaPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rctToken = await RctToken.deployed();

    await deployer.deploy(IsaPool, rctToken.address);
  });
};
