const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function sintropDeploy() {
  const sintropTimeBetweenRegeneratorInspections = process.env["SINTROP_TIME_BETWEEN_REGENERATOR_INSPECTIONS"];

  const sintropBlocksToExpireAceeptedInspection = process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

  const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

  const acceptInspectionDelayBlocks = process.env["SINTROP_ACCEPT_INSPECTION_DELAY_BLOCKS"];

  const securityBlocksToValidatorAnalysis = process.env["SINTROP_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const Sintrop = await ethers.getContractFactory("Sintrop");

  const args = [
    sintropTimeBetweenRegeneratorInspections,
    sintropBlocksToExpireAceeptedInspection,
    allowedInitialRequests,
    acceptInspectionDelayBlocks,
    securityBlocksToValidatorAnalysis,
  ];

  const sintrop = await Sintrop.deploy(...args);

  saveContractAddress("Sintrop", sintrop.target);

  console.log(`Sintrop address ${sintrop.target}`);

  await verifyContract(sintrop, "Sintrop", args);

  return sintrop;
}

module.exports = sintropDeploy;
