const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function validatorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidatorContract = await ethers.getContractFactory("ValidatorContract");

  const validatorContract = await ValidatorContract.deploy(firstValidatorLimit, secondValidatorLimit);

  saveContractAddress("ValidatorContract", validatorContract.target);

  await userContract.newAllowedCaller(validatorContract.target);

  console.log(`ValidatorContract address ${validatorContract.target}`);

  return validatorContract;
}

module.exports = validatorContractDeploy;
