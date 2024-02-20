const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function researcherPoolDeploy() {
  const pool_halving = process.env["RESEARCHER_POOL_HALVING"];
  const pool_total_eras = process.env["RESEARCHER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["RESEARCHER_POOL_BLOCKS_PER_ERA"];
  const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const ResearcherPool = await ethers.getContractFactory("ResearcherPool");

  const researcherPool = await ResearcherPool.deploy(rcToken.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("ResearcherPool", researcherPool.target);

  await rcToken.addContractPool(researcherPool.target, researcherPoolFunds);

  console.log(`ReseacherPool address ${researcherPool.target}`)

  return researcherPool;
}

module.exports = researcherPoolDeploy;
