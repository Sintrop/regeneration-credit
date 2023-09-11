const Sintrop = artifacts.require("Sintrop");
const ProducerContract = artifacts.require("ProducerContract");
const InspectorContract = artifacts.require("InspectorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const sintrop = await Sintrop.deployed();
    const producerContract = await ProducerContract.deployed();
    const inspectorContract = await InspectorContract.deployed();

    await inspectorContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);
  });
};
