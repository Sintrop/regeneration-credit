const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function contributorPoolDeploy() {
  const pool_halving = process.env["CONTRIBUTOR_POOL_HALVING"];
  const pool_total_eras = process.env["CONTRIBUTOR_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["CONTRIBUTOR_POOL_BLOCKS_PER_ERA"];
  const poolFunds = process.env["CONTRIBUTOR_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ContributorPool = await ethers.getContractFactory("ContributorPool");

  const contributorPool = await ContributorPool.deploy(regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("contributorPool", contributorPool.target);

  await regenerationCredit.addContractPool(contributorPool.target, poolFunds);

  console.log(`ContributorPool address ${contributorPool.target}`)

  return contributorPool;
}

module.exports = contributorPoolDeploy;
