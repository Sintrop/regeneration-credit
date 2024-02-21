const saveContractAddress = require("../scripts/shared/saveContractAddress");

async function rcTokenDeploy() {
  const rcTokensTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];

  const RcTokenIco = await ethers.getContractFactory("RcTokenIco");
  const RcToken = await ethers.getContractFactory("RcToken");

  const rcTokenIco = await RcTokenIco.deploy();
  const rcToken = await RcToken.deploy(rcTokensTotalTokens, rcTokenIco.target);

  saveContractAddress("RcTokenIco", rcTokenIco.target);
  saveContractAddress("RcToken", rcToken.target);

  console.log(`RcToken address ${rcToken.target}`)

  return { rcTokenIco, rcToken };
}

module.exports = rcTokenDeploy;
