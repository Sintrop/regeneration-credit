const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const sacToken = await SacToken.deployed();

    await deployer.deploy(IsaPool, sacToken.address);
  });
};
