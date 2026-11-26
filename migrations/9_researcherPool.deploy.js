const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function researcherPoolDeploy() {
  const poolHalving = process.env["POOL_HALVING"];
  const poolBlocksPerEra = process.env["BLOCKS_PER_ERA"];
  const poolDeployedAt = process.env["RESEARCHER_POOL_DEPLOYED_AT"] || 0;

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ResearcherPool = await ethers.getContractFactory("ResearcherPool");

  const args = [regenerationCredit.target, poolHalving, poolBlocksPerEra, poolDeployedAt];

  const researcherPool = await ResearcherPool.deploy(...args);

  saveContractAddress("ResearcherPool", researcherPool.target);

  console.log(`ReseacherPool address ${researcherPool.target}`);

  await verifyContract(researcherPool, "ResearcherPool", args);

  return researcherPool;
}

module.exports = researcherPoolDeploy;
