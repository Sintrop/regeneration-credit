const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const ValidatorContract = artifacts.require("ValidatorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const producerContract = await ProducerContract.deployed();

    const validatorContract = await deployer.deploy(
      ValidatorContract,
      userContract.address,
      producerContract.address
    );

    await userContract.newAllowedCaller(validatorContract.address);
    await producerContract.newAllowedCaller(validatorContract.address);
  });
};
