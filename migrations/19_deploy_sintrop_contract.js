const Sintrop = artifacts.require("Sintrop");
const InspectorContract = artifacts.require("InspectorContract");
const ProducerContract = artifacts.require("ProducerContract");
const UserContract = artifacts.require("UserContract");
const ValidatorContract = artifacts.require("ValidatorContract");
const ActivistContract = artifacts.require("ActivistContract");

const sintropTimeBetweenProducerInsertions =
  process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

const sintropBlocksToExpireAceeptedInspection =
  process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

const acceptInspectionDelayBlocks = process.env["SINTROP_ACCEPT_INSPECTION_DELAY_BLOCKS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const inspectorContract = await InspectorContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const userContract = await UserContract.deployed();
    const validatorContract = await ValidatorContract.deployed();
    const activistContract = await ActivistContract.deployed();

    const sintrop = await deployer.deploy(
      Sintrop,
      inspectorContract.address,
      producerContract.address,
      userContract.address,
      validatorContract.address,
      activistContract.address,
      sintropTimeBetweenProducerInsertions,
      sintropBlocksToExpireAceeptedInspection,
      allowedInitialRequests,
      acceptInspectionDelayBlocks
    );

    await inspectorContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);
    await validatorContract.newAllowedCaller(sintrop.address);
    await activistContract.newAllowedCaller(sintrop.address);
  });
};
