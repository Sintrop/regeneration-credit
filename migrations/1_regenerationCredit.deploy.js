const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationCreditDeploy() {
  const regenerationCreditsTotalTokens = process.env["RC_TOKENS_TOTAL_TOKENS"];
  const icoStartsAt = process.env["ICO_STARTS_AT"];
  const icoEndsAt = process.env["ICO_ENDS_AT"];

  const RegenerationCreditIco = await ethers.getContractFactory("RegenerationCreditIco");
  const RegenerationCredit = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCreditIcoArgs = [icoStartsAt, icoEndsAt];
  const regenerationCreditIco = await RegenerationCreditIco.deploy(...regenerationCreditIcoArgs);

  const regenerationCreditArgs = [regenerationCreditsTotalTokens, regenerationCreditIco.target];
  const regenerationCredit = await RegenerationCredit.deploy(...regenerationCreditArgs);

  saveContractAddress("RegenerationCreditIco", regenerationCreditIco.target);
  saveContractAddress("RegenerationCredit", regenerationCredit.target);

  console.log(`RegenerationCredit address ${regenerationCredit.target}`);
  console.log(`RegenerationCreditIco address ${regenerationCreditIco.target}`);

  await verifyContract(regenerationCreditIco, "RegenerationCreditIco", regenerationCreditIcoArgs);
  await verifyContract(regenerationCredit, "RegenerationCredit", regenerationCreditArgs);

  return { regenerationCreditIco, regenerationCredit };
}

module.exports = regenerationCreditDeploy;
