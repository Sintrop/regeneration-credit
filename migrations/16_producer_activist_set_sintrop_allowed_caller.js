const Sintrop = artifacts.require("Sintrop");
const ProducerContract = artifacts.require("ProducerContract");
const ActivistContract = artifacts.require("ActivistContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const sintrop = await Sintrop.deployed();
    const producerContract = await ProducerContract.deployed();
    const activistContract = await ActivistContract.deployed();

    await activistContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);
  });
};
