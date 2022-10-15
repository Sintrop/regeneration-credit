const SacToken = artifacts.require("SacToken");

const sacTokensTotalTokens = process.env["SAC_TOKENS_TOTAL_TOKENS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(SacToken, sacTokensTotalTokens);
  });
};
