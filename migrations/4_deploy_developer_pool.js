const RctToken = artifacts.require("RctToken");
const DeveloperPool = artifacts.require("DeveloperPool");

const developerPoolEraMax = process.env["DEVELOPER_POOL_ERA_MAX"];
const developerPoolBlocksPerEra = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rctToken = await RctToken.deployed();

    await deployer.deploy(
      DeveloperPool,
      rctToken.address,
      developerPoolBlocksPerEra,
      developerPoolEraMax
    );
  });
};
