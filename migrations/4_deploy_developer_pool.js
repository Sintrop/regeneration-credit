const SacToken = artifacts.require("SacToken");
const DeveloperPool = artifacts.require("DeveloperPool");

const developerPoolEraMax = process.env["DEVELOPER_POOL_ERA_MAX"];
const developerPoolBlocksPerEra = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const sacToken = await SacToken.deployed();

    await deployer.deploy(
      DeveloperPool,
      sacToken.address,
      developerPoolBlocksPerEra,
      developerPoolEraMax
    );
  });
};
