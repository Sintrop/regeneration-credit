const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function validatorContractDeploy() {
  const userContract = await getDeployedContract("UserContract");
  const validatorPool = await getDeployedContract("ValidatorPool");
  const producerContract = await getDeployedContract("ProducerContract");
  const inspectorContract = await getDeployedContract("InspectorContract");

  const firstValidatorLimit = process.env["FIRST_VALIDATOR_LIMIT"];
  const secondValidatorLimit = process.env["SECOND_VALIDATOR_LIMIT"];

  const ValidatorContract = await ethers.getContractFactory("ValidatorContract");

  const validatorContract = await ValidatorContract.deploy(
    userContract.target,
    producerContract.target,
    validatorPool.target,
    inspectorContract.target,
    firstValidatorLimit,
    secondValidatorLimit
  );

  saveContractAddress("ValidatorContract", validatorContract.target);

  await userContract.newAllowedCaller(validatorContract.target);
  await producerContract.newAllowedCaller(validatorContract.target);
  await validatorPool.newAllowedCaller(validatorContract.target);
  await inspectorContract.newAllowedCaller(validatorContract.target);

  console.log(`ValidatorContract address ${validatorContract.target}`);

  return validatorContract;
}

module.exports = validatorContractDeploy;
