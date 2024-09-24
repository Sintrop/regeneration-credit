const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherPoolDeploy() {
  const pool_halving = process.env["RESEARCHER_POOL_HALVING"];
  const pool_total_eras = process.env["RESEARCHER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["RESEARCHER_POOL_BLOCKS_PER_ERA"];
  const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ResearcherPool = await ethers.getContractFactory("ResearcherPool");

  const args = [regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era];

  const researcherPool = await ResearcherPool.deploy(...args);

  saveContractAddress("ResearcherPool", researcherPool.target);

  await regenerationCredit.addContractPool(researcherPool.target, researcherPoolFunds);

  console.log(`ReseacherPool address ${researcherPool.target}`);

  await verifyContract(researcherPool.target, args);

  return researcherPool;
}

module.exports = researcherPoolDeploy;
