const RcToken = artifacts.require("RcToken");
const DeveloperPool = artifacts.require("DeveloperPool");

const developerPoolEraMax = process.env["DEVELOPER_POOL_ERA_MAX"];
const developerPoolBlocksPerEra = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();

    await deployer.deploy(
      DeveloperPool,
      rcToken.address,
      developerPoolBlocksPerEra,
      developerPoolEraMax
    );
  });
};
