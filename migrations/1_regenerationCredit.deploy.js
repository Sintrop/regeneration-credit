const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationCreditDeploy() {
  const regenerationCreditsTotalTokens = process.env["RCT_TOKENS_TOTAL_TOKENS"];

  const RegenerationCreditIco = await ethers.getContractFactory("RegenerationCreditIco");
  const RegenerationCredit = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCreditIco = await RegenerationCreditIco.deploy();

  const regenerationCreditArgs = [regenerationCreditsTotalTokens, regenerationCreditIco.target];
  const regenerationCredit = await RegenerationCredit.deploy(...regenerationCreditArgs);

  saveContractAddress("RegenerationCreditIco", regenerationCreditIco.target);
  saveContractAddress("RegenerationCredit", regenerationCredit.target);

  console.log(`RegenerationCredit address ${regenerationCredit.target}`);
  console.log(`RegenerationCreditIco address ${regenerationCreditIco.target}`);

  await verifyContract(regenerationCreditIco.target);
  await verifyContract(regenerationCredit.target, regenerationCreditArgs);

  return { regenerationCreditIco, regenerationCredit };
}

module.exports = regenerationCreditDeploy;
