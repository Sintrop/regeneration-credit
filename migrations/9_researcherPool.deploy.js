const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];
  const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ResearcherPool = await ethers.getContractFactory("ResearcherPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra];

  const researcherPool = await ResearcherPool.deploy(...args);

  saveContractAddress("ResearcherPool", researcherPool.target);

  await regenerationCredit.addContractPool(researcherPool.target, researcherPoolFunds);

  console.log(`ReseacherPool address ${researcherPool.target}`);

  await verifyContract(researcherPool, "ResearcherPool", args);

  return researcherPool;
}

module.exports = researcherPoolDeploy;
