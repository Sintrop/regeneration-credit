const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function contributorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const contributorPool = await getDeployedContract("ContributorPool");

  const ContributorContract = await ethers.getContractFactory("ContributorContract");

  const contributorContract = await ContributorContract.deploy(
    userContract.target,
    contributorPool.target
  );

  saveContractAddress("contributorContract", contributorContract.target);

  await userContract.newAllowedCaller(contributorContract.target);
  await contributorContract.newAllowedCaller(contributorPool.target);

  console.log(`ContributorContract address ${contributorContract.target}`);

  return contributorContract;
}

module.exports = contributorContractDeploy;
