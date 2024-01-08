const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const ValidatorContract = artifacts.require("ValidatorContract");
    const ValidatorPool = artifacts.require("ValidatorPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const validatorPool = await ValidatorPool.deployed();

    const validatorContract = await deployer.deploy(
      ValidatorContract,
      userContract.address,
      producerContract.address,
      validatorPool.address
    );

    await userContract.newAllowedCaller(validatorContract.address);
    await producerContract.newAllowedCaller(validatorContract.address);
    await validatorPool.newAllowedCaller(validatorContract.address);
  });
};
