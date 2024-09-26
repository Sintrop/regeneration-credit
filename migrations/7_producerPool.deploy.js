const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function producerPoolDeploy() {
  const pool_halving = process.env["PRODUCER_POOL_HALVING"];
  const pool_total_eras = process.env["PRODUCER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["PRODUCER_POOL_BLOCKS_PER_ERA"];
  const producerPoolFunds = process.env["PRODUCER_POOL_FUNDS"];

  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  const ProducerPool = await ethers.getContractFactory("ProducerPool");

  const args = [regenerationCredit.target, pool_halving, pool_total_eras, pool_blocks_per_era];

  const producerPool = await ProducerPool.deploy(...args);

  saveContractAddress("ProducerPool", producerPool.target);

  await regenerationCredit.addContractPool(producerPool.target, producerPoolFunds);

  console.log(`ProducerPool address ${producerPool.target}`);

  await verifyContract(producerPool, "ProducerPool", args);

  return producerPool;
}

module.exports = producerPoolDeploy;
