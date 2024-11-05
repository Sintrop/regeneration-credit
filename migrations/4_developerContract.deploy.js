const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function developerContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const developerPool = await getDeployedContract("DeveloperPool");
  const validatorContract = await getDeployedContract("ValidatorContract");

  const DeveloperContract = await ethers.getContractFactory("DeveloperContract");

  const developerMaxPenalties = process.env["DEVELOPER_MAX_PENALTIES"];
  const securityBlocksToValidatorAnalysis = process.env["DEVELOPER_SECURITY_BLOCKS_TO_VALIDATOR_ANALYSIS"];

  const args = [
    userContract.target,
    developerPool.target,
    validatorContract.target,
    developerMaxPenalties,
    securityBlocksToValidatorAnalysis,
  ];

  const developerContract = await DeveloperContract.deploy(...args);

  saveContractAddress("DeveloperContract", developerContract.target);

  await developerPool.newAllowedCaller(developerContract.target);
  await userContract.newAllowedCaller(developerContract.target);
  await developerContract.newAllowedCaller(validatorContract.target);

  console.log(`DeveloperContract address ${developerContract.target}`);

  await verifyContract(developerContract, "DeveloperContract", args);

  return developerContract;
}

module.exports = developerContractDeploy;
