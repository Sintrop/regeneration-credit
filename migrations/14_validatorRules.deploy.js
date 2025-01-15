const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validatorRulesDeploy() {
  const userRules = await getDeployedContract("UserRules");
  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidatorRules = await ethers.getContractFactory("ValidatorRules");

  const args = [firstValidatorLimit, secondValidatorLimit];

  const validatorRules = await ValidatorRules.deploy(...args);

  saveContractAddress("ValidatorRules", validatorRules.target);

  await userRules.newAllowedCaller(validatorRules.target);

  console.log(`ValidatorRules address ${validatorRules.target}`);

  await verifyContract(validatorRules, "ValidatorRules", args);

  return validatorRules;
}

module.exports = validatorRulesDeploy;
