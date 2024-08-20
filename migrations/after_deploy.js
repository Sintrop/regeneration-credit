const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  configureValidatorContract();

  console.log("After Depoloy OK");
}

async function configureValidatorContract() {
  const validatorContract = await getDeployedContract("ValidatorContract");
  const userContract = await getDeployedContract("UserContract");
  const validatorPool = await getDeployedContract("ValidatorPool");
  const producerContract = await getDeployedContract("ProducerContract");
  const inspectorContract = await getDeployedContract("InspectorContract");
  const developerContract = await getDeployedContract("DeveloperContract");
  const researcherContract = await getDeployedContract("ResearcherContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const contributorContract = await getDeployedContract("ContributorContract");

  const contractDependencies = {
    userContractAddress: userContract.target,
    producerContractAddress: producerContract.target,
    validatorPoolAddress: validatorPool.target,
    inspectorContractAddress: inspectorContract.target,
    developerContractAddress: developerContract.target,
    researcherContractAddress: researcherContract.target,
    activistContractAddress: activistContract.target,
    contributorContractAddress: contributorContract
  };

  await validatorContract.setContractAddressDependencies(contractDependencies);
  await producerContract.newAllowedCaller(validatorContract.target);
  await validatorPool.newAllowedCaller(validatorContract.target);
  await inspectorContract.newAllowedCaller(validatorContract.target);
}

module.exports = afterDeploy;
