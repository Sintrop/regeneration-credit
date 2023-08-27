const RcToken = artifacts.require("RcToken");

const rcTokensTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(RcToken, rcTokensTotalTokens);
  });
};
