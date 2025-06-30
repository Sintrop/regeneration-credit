const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectionRulesDeploy() {
  const sintropTimeBetweenRegeneratorInspections = process.env["TIME_BETWEEN_REGENERATOR_INSPECTIONS"];

  const sintropBlocksToExpireAceeptedInspection = process.env["BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

  const allowedInitialRequests = process.env["ALLOWED_INITIAL_REQUESTS"];

  const acceptInspectionDelayBlocks = process.env["ACCEPT_INSPECTION_DELAY_BLOCKS"];

  const securityBlocksToValidatorAnalysis = process.env["INSPECTION_securityBlocksToValidation"];

  const InspectionRules = await ethers.getContractFactory("InspectionRules");

  const args = [
    sintropTimeBetweenRegeneratorInspections,
    sintropBlocksToExpireAceeptedInspection,
    allowedInitialRequests,
    acceptInspectionDelayBlocks,
    securityBlocksToValidatorAnalysis,
  ];

  const sintrop = await InspectionRules.deploy(...args);

  saveContractAddress("InspectionRules", sintrop.target);

  console.log(`InspectionRules address ${sintrop.target}`);

  await verifyContract(sintrop, "InspectionRules", args);

  return sintrop;
}

module.exports = inspectionRulesDeploy;
