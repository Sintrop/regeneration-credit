const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function sintropDeploy() {
  const sintropTimeBetweenProducerInspections = process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

  const sintropBlocksToExpireAceeptedInspection = process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

  const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

  const acceptInspectionDelayBlocks = process.env["SINTROP_ACCEPT_INSPECTION_DELAY_BLOCKS"];

  const securityBlocksToValidatorAnalysis = process.env["SINTROP_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const Sintrop = await ethers.getContractFactory("Sintrop");

  const sintrop = await Sintrop.deploy(
    sintropTimeBetweenProducerInspections,
    sintropBlocksToExpireAceeptedInspection,
    allowedInitialRequests,
    acceptInspectionDelayBlocks,
    securityBlocksToValidatorAnalysis
  );

  saveContractAddress("Sintrop", sintrop.target);

  console.log(`Sintrop address ${sintrop.target}`);

  return sintrop;
}

module.exports = sintropDeploy;
