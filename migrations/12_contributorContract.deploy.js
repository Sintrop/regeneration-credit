const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorContract = await ethers.getContractFactory("ContributorContract");

  const securityBlocksToValidatorAnalysis = process.env["CONTRIBUTOR_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [userContract.target, contributorPool.target, securityBlocksToValidatorAnalysis];

  const contributorContract = await ContributorContract.deploy(...args);

  saveContractAddress("ContributorContract", contributorContract.target);

  await userContract.newAllowedCaller(contributorContract.target);
  await contributorContract.newAllowedCaller(contributorPool.target);

  console.log(`ContributorContract address ${contributorContract.target}`);

  await verifyContract(contributorContract, "ContributorContract", args);

  return contributorContract;
}

module.exports = contributorContractDeploy;
