const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const developerPool = await getDeployedContract("DeveloperPool");
  const validatorContract = await getDeployedContract("ValidatorRules");

  const DeveloperRules = await ethers.getContractFactory("DeveloperRules");

  const developerMaxPenalties = process.env["DEVELOPER_MAX_PENALTIES"];
  const securityBlocksToValidatorAnalysis = process.env["DEVELOPER_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [
    userContract.target,
    developerPool.target,
    validatorContract.target,
    developerMaxPenalties,
    securityBlocksToValidatorAnalysis,
  ];

  const developerContract = await DeveloperRules.deploy(...args);

  saveContractAddress("DeveloperRules", developerContract.target);

  await developerPool.newAllowedCaller(developerContract.target);
  await userContract.newAllowedCaller(developerContract.target);
  await developerContract.newAllowedCaller(validatorContract.target);

  console.log(`DeveloperRules address ${developerContract.target}`);

  await verifyContract(developerContract, "DeveloperRules", args);

  return developerContract;
}

module.exports = developerContractDeploy;
