const RcToken = artifacts.require("RcToken");
const IsaPool = artifacts.require("IsaPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    await deployer.deploy(IsaPool, rcToken.address);
  });
};
