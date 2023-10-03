const RcToken = artifacts.require("RcToken");
const RcTokenIco = artifacts.require("RcTokenIco");

const rcTokensTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcTokenICO = await deployer.deploy(RcTokenIco);

    const rcToken = await deployer.deploy(RcToken, rcTokensTotalTokens, rcTokenICO.address);

    rcTokenICO.setRcToken(rcToken.address);
  });
};
