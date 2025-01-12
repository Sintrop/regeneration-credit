const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validatorContractDeploy() {
  const userContract = await getDeployedContract("UserRules");
  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidatorRules = await ethers.getContractFactory("ValidatorRules");

  const args = [firstValidatorLimit, secondValidatorLimit];

  const validatorContract = await ValidatorRules.deploy(...args);

  saveContractAddress("ValidatorRules", validatorContract.target);

  await userContract.newAllowedCaller(validatorContract.target);

  console.log(`ValidatorRules address ${validatorContract.target}`);

  await verifyContract(validatorContract, "ValidatorRules", args);

  return validatorContract;
}

module.exports = validatorContractDeploy;
