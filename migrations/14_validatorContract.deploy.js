const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function validatorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidatorContract = await ethers.getContractFactory("ValidatorContract");

  const args = [firstValidatorLimit, secondValidatorLimit];

  const validatorContract = await ValidatorContract.deploy(...args);

  saveContractAddress("ValidatorContract", validatorContract.target);

  await userContract.newAllowedCaller(validatorContract.target);

  console.log(`ValidatorContract address ${validatorContract.target}`);

  await verifyContract(validatorContract.target, args);

  return validatorContract;
}

module.exports = validatorContractDeploy;
