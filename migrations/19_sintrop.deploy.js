const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function sintropDeploy() {
  const sintropTimeBetweenProducerInspections = process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

  const sintropBlocksToExpireAceeptedInspection = process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

  const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

  const acceptInspectionDelayBlocks = process.env["SINTROP_ACCEPT_INSPECTION_DELAY_BLOCKS"];

  const inspectorContract = await getDeployedContract("InspectorContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const userContract = await getDeployedContract("UserContract");
  const producerContract = await getDeployedContract("ProducerContract");
  const validatorContract = await getDeployedContract("ValidatorContract");

  const Sintrop = await ethers.getContractFactory("Sintrop");

  const sintrop = await Sintrop.deploy(
    inspectorContract.target,
    producerContract.target,
    userContract.target,
    validatorContract.target,
    activistContract.target,
    sintropTimeBetweenProducerInspections,
    sintropBlocksToExpireAceeptedInspection,
    allowedInitialRequests,
    acceptInspectionDelayBlocks
  );

  saveContractAddress("Sintrop", sintrop.target);

  await activistContract.newAllowedCaller(sintrop.target);
  await inspectorContract.newAllowedCaller(sintrop.target);
  await producerContract.newAllowedCaller(sintrop.target);
  await userContract.newAllowedCaller(sintrop.target);
  await validatorContract.newAllowedCaller(sintrop.target);

  console.log(`Sintrop address ${sintrop.target}`)

  return sintrop;
}

module.exports = sintropDeploy;
