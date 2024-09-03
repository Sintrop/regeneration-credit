const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  await configureValidatorContract();
  await configureSintrop();
  await addCategories();

  console.log("After Deploy OK");
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

async function addCategories() {
  const categoryContract = await getDeployedContract("CategoryContract");

  await categoryContract.addCategory("Carbon", "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]", [
    {
      isaId: 1, 
      description: "Balance > 100.000"
    },
    {
      isaId: 2, 
      description: "100.000 > Balance > 10.000"
    },
    {
      isaId: 3, 
      description: "10.000 > Balance > 1000"
    },
    {
      isaId: 4, 
      description: "1000 > Balance > 100"
    },
    {
      isaId: 5, 
      description: "100 > Balance > 10"
    },
    {
      isaId: 6, 
      description: "10 > Balance > 0"
    },
    {
      isaId: 7, 
      description: "Not applicable"
    },
    {
      isaId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      isaId: 9, 
      description: "-100 < Balance < -10"
    },
    {
      isaId: 10, 
      description: "-1.000 < Balance < -100"
    },
    {
      isaId: 11, 
      description: "-10.000 < Balance < -1.000"
    },
    {
      isaId: 12, 
      description: "-100.000 < Balance < -10.000"
    },
    {
      isaId: 13, 
      description: "Balance < -100.000"
    },
  ])

  await categoryContract.addCategory("Soil", "Indicator to measure impact of soil. Balance = regenerating soil - degradation soil [ha]", [
    {
      isaId: 1, 
      description: "Balance > 1000"
    },
    {
      isaId: 2, 
      description: "1000 > Balance > 100"
    },
    {
      isaId: 3, 
      description: "100 > Balance > 10"
    },
    {
      isaId: 4, 
      description: "10 > Balance > 2"
    },
    {
      isaId: 5, 
      description: "2 > Balance > 1"
    },
    {
      isaId: 6, 
      description: "1 > Balance > 0"
    },
    {
      isaId: 7, 
      description: "Not applicable"
    },
    {
      isaId: 8, 
      description: "-1 < Balance < 0"
    },
    {
      isaId: 9, 
      description: "-2 < Balance < -1"
    },
    {
      isaId: 10, 
      description: "-10 < Balance < -2"
    },
    {
      isaId: 11, 
      description: "-100 < Balance < -10"
    },
    {
      isaId: 12, 
      description: "-1000 < Balance < -100"
    },
    {
      isaId: 13, 
      description: "Balance < -1000"
    },
  ])
  await categoryContract.addCategory("Water", "Indicator to measure water balance. Balance = vegetation water impact + self harvest water - used water [m3]", [
    {
      isaId: 1, 
      description: "Balance > 100.000"
    },
    {
      isaId: 2, 
      description: "100.000 > Balance > 10.000"
    },
    {
      isaId: 3, 
      description: "10.000 > Balance > 1000"
    },
    {
      isaId: 4, 
      description: "1000 > Balance > 100"
    },
    {
      isaId: 5, 
      description: "100 > Balance > 10"
    },
    {
      isaId: 6, 
      description: "10 > Balance > 0"
    },
    {
      isaId: 7, 
      description: "Not applicable"
    },
    {
      isaId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      isaId: 9, 
      description: "-100 < Balance < -10"
    },
    {
      isaId: 10, 
      description: "-1.000 < Balance < -100"
    },
    {
      isaId: 11, 
      description: "-10.000 < Balance < -1.000"
    },
    {
      isaId: 12, 
      description: "-100.000 < Balance < -10.000"
    },
    {
      isaId: 13, 
      description: "Balance < -100.000"
    },
  ])

  await categoryContract.addCategory("Biodiversity", "Indicator to measure the level of plant and animal biodiversity. Our unit is 'unit of life', meaning one species of fauna and flora. Balance = ul restored - ul destroyed. [ul].", [
    {
      isaId: 1, 
      description: "Balance > 1000"
    },
    {
      isaId: 2, 
      description: "1000 > Balance > 200"
    },
    {
      isaId: 3, 
      description: "200 > Balance > 100"
    },
    {
      isaId: 4, 
      description: "100 > Balance > 50"
    },
    {
      isaId: 5, 
      description: "50 > Balance > 10"
    },
    {
      isaId: 6, 
      description: "10 > Balance > 0"
    },
    {
      isaId: 7, 
      description: "Not applicable"
    },
    {
      isaId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      isaId: 9, 
      description: "-50 < Balance < -10"
    },
    {
      isaId: 10, 
      description: "-100 < Balance < -50"
    },
    {
      isaId: 11, 
      description: "-200 < Balance < -100"
    },
    {
      isaId: 12, 
      description: "-1.000 < Balance < -200"
    },
    {
      isaId: 13, 
      description: "Balance < -1.000"
    },
  ])    

  var isaDescription = await categoryContract.getCategoryIsaDescription(1);
  console.log("After categories OK");
  console.log(isaDescription);

}

module.exports = afterDeploy;
