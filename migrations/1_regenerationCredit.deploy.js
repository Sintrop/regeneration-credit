const saveContractAddress = require("../scripts/shared/saveContractAddress");

async function regenerationCreditDeploy() {
  const regenerationCreditsTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];
  const icoStartsAt = process.env["ICO_STARTS_AT"];
  const icoEndsAt = process.env["ICO_ENDS_AT"];

  const RegenerationCreditIco = await ethers.getContractFactory("RegenerationCreditIco");
  const RegenerationCredit = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCreditIco = await RegenerationCreditIco.deploy(icoStartsAt, icoEndsAt);
  const regenerationCredit = await RegenerationCredit.deploy(regenerationCreditsTotalTokens, regenerationCreditIco.target);

  saveContractAddress("RegenerationCreditIco", regenerationCreditIco.target);
  saveContractAddress("RegenerationCredit", regenerationCredit.target);

  console.log(`RegenerationCredit address ${regenerationCredit.target}`)

  return { regenerationCreditIco, regenerationCredit };
}

module.exports = regenerationCreditDeploy;
