const Sintrop = artifacts.require("Sintrop");
const InspectorContract = artifacts.require("InspectorContract");
const ProducerContract = artifacts.require("ProducerContract");
const UserContract = artifacts.require("UserContract");

const sintropTimeBetweenProducerInsertions =
  process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

const sintropBlocksToExpireAceeptedInspection =
  process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const inspectorContract = await InspectorContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const userContract = await UserContract.deployed();

    await deployer.deploy(
      Sintrop,
      inspectorContract.address,
      producerContract.address,
      userContract.address,
      sintropTimeBetweenProducerInsertions,
      sintropBlocksToExpireAceeptedInspection,
      allowedInitialRequests
    );
  });
};
