const RctToken = artifacts.require("RctToken");

const rctTokensTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(RctToken, rctTokensTotalTokens);
  });
};
