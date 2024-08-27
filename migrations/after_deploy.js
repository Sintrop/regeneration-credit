const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  configureValidatorContract();
  configureSintrop();

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

  console.log("After ValidatorContract deploy is OK");
}


async function configureSintrop() {
  const sintrop = await getDeployedContract("Sintrop");
  const inspectorContract = await getDeployedContract("InspectorContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const userContract = await getDeployedContract("UserContract");
  const producerContract = await getDeployedContract("ProducerContract");
  const validatorContract = await getDeployedContract("ValidatorContract");
  const categoryContract = await getDeployedContract("CategoryContract");

  const contractDependencies = {
    userContractAddress: userContract.target,
    producerContractAddress: producerContract.target,
    validatorContractAddress: validatorContract.target,
    inspectorContractAddress: inspectorContract.target,
    activistContractAddress: activistContract.target,
    categoryContractAddress: categoryContract.target
  };

  await sintrop.setContractAddressDependencies(contractDependencies);

  await activistContract.newAllowedCaller(sintrop.target);
  await inspectorContract.newAllowedCaller(sintrop.target);
  await producerContract.newAllowedCaller(sintrop.target);
  await userContract.newAllowedCaller(sintrop.target);
  await validatorContract.newAllowedCaller(sintrop.target);
  await categoryContract.newAllowedCaller(sintrop.target);

  console.log("After Sintrop deploy is OK");
}

module.exports = afterDeploy;
