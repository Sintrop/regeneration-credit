const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function producerPoolDeploy() {
  const pool_halving = process.env["PRODUCER_POOL_HALVING"];
  const pool_total_eras = process.env["PRODUCER_POOL_TOTAL_ERAS"];
  const pool_blocks_per_era = process.env["PRODUCER_POOL_BLOCKS_PER_ERA"];
  const producerPoolFunds = process.env["PRODUCER_POOL_FUNDS"];

  const rcToken = await getDeployedContract("RcToken");

  const ProducerPool = await ethers.getContractFactory("ProducerPool");

  const producerPool = await ProducerPool.deploy(rcToken.target, pool_halving, pool_total_eras, pool_blocks_per_era);

  saveContractAddress("ProducerPool", producerPool.target);

  await rcToken.addContractPool(producerPool.target, producerPoolFunds);

  console.log(`ProducerPool address ${producerPool.target}`)

  return producerPool;
}

module.exports = producerPoolDeploy;
