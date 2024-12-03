const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationCreditDeploy() {
  const regenerationCreditsTotalTokens = process.env["RC_TOKENS_TOTAL_TOKENS"];

  const RegenerationCredit = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCreditArgs = [regenerationCreditsTotalTokens];
  const regenerationCredit = await RegenerationCredit.deploy(...regenerationCreditArgs);

  saveContractAddress("RegenerationCredit", regenerationCredit.target);

  console.log(`RegenerationCredit address ${regenerationCredit.target}`);

  await verifyContract(regenerationCredit, "RegenerationCredit", regenerationCreditArgs);

  return { regenerationCredit };
}

module.exports = regenerationCreditDeploy;
