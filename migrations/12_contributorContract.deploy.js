const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorContract = await ethers.getContractFactory("ContributorContract");

  const args = [userContract.target, contributorPool.target];

  const contributorContract = await ContributorContract.deploy(...args);

  saveContractAddress("contributorContract", contributorContract.target);

  await userContract.newAllowedCaller(contributorContract.target);
  await contributorContract.newAllowedCaller(contributorPool.target);

  console.log(`ContributorContract address ${contributorContract.target}`);

  await verifyContract(contributorContract.target, args);

  return contributorContract;
}

module.exports = contributorContractDeploy;
