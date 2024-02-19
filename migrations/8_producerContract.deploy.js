const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function producerContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const producerPool = await getDeployedContract("ProducerPool");

  const ProducerContract = await ethers.getContractFactory("ProducerContract");

  const producerContract = await ProducerContract.deploy(
    userContract.target,
    producerPool.target
  );

  saveContractAddress("ProducerContract", producerContract.target);

  await userContract.newAllowedCaller(producerContract.target);
  await producerPool.newAllowedCaller(producerContract.target);

  return producerContract;
}

module.exports = producerContractDeploy;
