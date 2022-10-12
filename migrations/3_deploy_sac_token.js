const SacToken = artifacts.require("SacToken");

module.exports = function (deployer) {
  const args = {
    totalTokens: "1500000000000000000000000000",
  };

  deployer.then(async () => {
    await deployer.deploy(SacToken, args.totalTokens);
  });
};
