const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(ProducerContract, userContract.address);
  });
};
