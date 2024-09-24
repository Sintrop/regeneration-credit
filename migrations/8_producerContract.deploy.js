const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function producerContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const producerPool = await getDeployedContract("ProducerPool");

  const ProducerContract = await ethers.getContractFactory("ProducerContract");

  const args = [userContract.target, producerPool.target];

  const producerContract = await ProducerContract.deploy(...args);

  saveContractAddress("ProducerContract", producerContract.target);

  await userContract.newAllowedCaller(producerContract.target);
  await producerPool.newAllowedCaller(producerContract.target);

  console.log(`ProducerContract address ${producerContract.target}`);

  await verifyContract(producerContract.target, args);

  return producerContract;
}

module.exports = producerContractDeploy;
