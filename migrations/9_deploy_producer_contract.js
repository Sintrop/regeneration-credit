const UserContract = artifacts.require("UserContract");
const ProducerPool = artifacts.require("ProducerPool");
const ProducerContract = artifacts.require("ProducerContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const producerPool = await ProducerPool.deployed();

    const producerContract = await deployer.deploy(
      ProducerContract,
      userContract.address,
      producerPool.address
    );

    await producerPool.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(producerContract.address);
  });
};
