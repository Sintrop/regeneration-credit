const Sintrop = artifacts.require("Sintrop");
const ActivistContract = artifacts.require("ActivistContract");
const ProducerContract = artifacts.require("ProducerContract");

const sintropTimeBetweenProducerInsertions =
  process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

const sintropTimeToExpire = 10; 

module.exports = function (deployer) {
  deployer.then(async () => {
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();

    await deployer.deploy(Sintrop,
      activistContract.address,
      producerContract.address,
      sintropTimeBetweenProducerInsertions,
      sintropTimeToExpire
    );
  });
};
