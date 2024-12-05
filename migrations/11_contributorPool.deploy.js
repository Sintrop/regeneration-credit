const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function contributorPoolDeploy() {
  const poolHalving = process.env["CONTRIBUTOR_POOL_HALVING"];
  const poolBlocksPerEra = process.env["CONTRIBUTOR_POOL_BLOCKS_PER_ERA"];
  const poolFunds = process.env["CONTRIBUTOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ContributorPool = await ethers.getContractFactory("ContributorPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const contributorPool = await ContributorPool.deploy(...args);

  saveContractAddress("ContributorPool", contributorPool.target);

  await regenerationCredit.addContractPool(contributorPool.target, poolFunds);

  console.log(`ContributorPool address ${contributorPool.target}`);

  await verifyContract(contributorPool, "ContributorPool", args);

  return contributorPool;
}

module.exports = contributorPoolDeploy;
