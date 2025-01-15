const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function inspectionRulesDeploy() {
  const sintropTimeBetweenRegeneratorInspections = process.env["SINTROP_TIME_BETWEEN_REGENERATOR_INSPECTIONS"];

  const sintropBlocksToExpireAceeptedInspection = process.env["SINTROP_BLOCKS_TO_EXPIRE_ACCEPTED_INSPECTION"];

  const allowedInitialRequests = process.env["SINTROP_ALLOWED_INITIAL_REQUESTS"];

  const acceptInspectionDelayBlocks = process.env["SINTROP_ACCEPT_INSPECTION_DELAY_BLOCKS"];

  const securityBlocksToValidatorAnalysis = process.env["SINTROP_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

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
