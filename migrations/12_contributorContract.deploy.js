const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorRules = await ethers.getContractFactory("ContributorRules");

  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [userContract.target, contributorPool.target, securityBlocksToValidatorAnalysis];

  const contributorContract = await ContributorRules.deploy(...args);

  saveContractAddress("ContributorRules", contributorContract.target);

  await userContract.newAllowedCaller(contributorContract.target);
  await contributorContract.newAllowedCaller(contributorPool.target);

  console.log(`ContributorRules address ${contributorContract.target}`);

  await verifyContract(contributorContract, "ContributorRules", args);

  return contributorContract;
}

module.exports = contributorContractDeploy;
