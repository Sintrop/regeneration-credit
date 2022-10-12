const SacToken = artifacts.require("SacToken");
const DeveloperPool = artifacts.require("DeveloperPool");

module.exports = function (deployer) {
  const args = {
    blocksPerEra: 10,
    eraMax: 18,
  };

  deployer.then(async () => {
    const sacToken = await SacToken.deployed();

    await deployer.deploy(
      DeveloperPool,
      sacToken.address,
      args.blocksPerEra,
      args.eraMax
    );
  });
};
