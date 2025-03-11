const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validationRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidationRules = await ethers.getContractFactory("ValidationRules");

  const args = [firstValidatorLimit, secondValidatorLimit];

  const validationRules = await ValidationRules.deploy(...args);

  saveContractAddress("ValidationRules", validationRules.target);

  await communityRules.newAllowedCaller(validationRules.target);

  console.log(`ValidationRules address ${validationRules.target}`);

  await verifyContract(validationRules, "ValidationRules", args);

  return validationRules;
}

module.exports = validationRulesDeploy;
