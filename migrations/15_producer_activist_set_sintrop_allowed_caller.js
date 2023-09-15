const Sintrop = artifacts.require("Sintrop");
const ProducerContract = artifacts.require("ProducerContract");
const InspectorContract = artifacts.require("InspectorContract");
const ValidatorContract = artifacts.require("ValidatorContract"); 

module.exports = function (deployer) {
  deployer.then(async () => {
    const sintrop = await Sintrop.deployed();
    const producerContract = await ProducerContract.deployed();
    const inspectorContract = await InspectorContract.deployed();
    const validatorContract = await ValidatorContract.deployed();

    await inspectorContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);
    await validatorContract.newAllowedCaller(sintrop.address);
  });
};
