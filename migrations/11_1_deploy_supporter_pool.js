const RcToken = artifacts.require("RcToken");
const SupporterPool = artifacts.require("SupporterPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    const supporterPoolFunds = 0;

    const supporterPool = await deployer.deploy(SupporterPool, rcToken.address);
    await rcToken.addContractPool(supporterPool.address, supporterPoolFunds);
  });
};
