const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  await configureValidatorContract();
  await configureSintrop();
  await addCategories();
  await renounceOwnership();

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

  console.log("After categories OK");
}

async function renounceOwnership() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");
  const sintrop = await getDeployedContract("Sintrop");
  const categoryContract = await getDeployedContract("CategoryContract");
  const userContract = await getDeployedContract("UserContract");
  const inspectorContract = await getDeployedContract("InspectorContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const producerContract = await getDeployedContract("ProducerContract");
  const validatorContract = await getDeployedContract("ValidatorContract");
  const developerContract = await getDeployedContract("DeveloperContract");
  const researcherContract = await getDeployedContract("ResearcherContract");
  const contributorContract = await getDeployedContract("ContributorContract");
  const producerPool = await getDeployedContract("ProducerPool");
  const inspectorPool = await getDeployedContract("InspectorPool");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const developerPool = await getDeployedContract("DeveloperPool");
  const contributorPool = await getDeployedContract("ContributorPool");
  const activistPool = await getDeployedContract("ActivistPool");
  const validatorPool = await getDeployedContract("ValidatorPool");

  await regenerationCredit.renounceOwnership();
  await sintrop.renounceOwnership();
  await categoryContract.renounceOwnership();
  await userContract.renounceOwnership();
  await inspectorContract.renounceOwnership();
  await activistContract.renounceOwnership();
  await producerContract.renounceOwnership();
  await validatorContract.renounceOwnership();
  await developerContract.renounceOwnership();
  await researcherContract.renounceOwnership();
  await contributorContract.renounceOwnership();
  await producerPool.renounceOwnership();
  await inspectorPool.renounceOwnership();
  await researcherPool.renounceOwnership();
  await developerPool.renounceOwnership();
  await contributorPool.renounceOwnership();
  await activistPool.renounceOwnership();
  await validatorPool.renounceOwnership();
}

async function inviteUsers() {
  const invitationContract = await getDeployedContract("InvitationContract");

  //testnet
  await invitationContract.onlyOwnerInvite(0x9D89B8562B00713a034DEb7A867D5d3Bc45e19E6, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);
  
  //producers
  await invitationContract.onlyOwnerInvite(0x7BeF1D59d946023eEb4c222F7d3a446D21f76bb1, 1);
  await invitationContract.onlyOwnerInvite(0x798829c56E9Bf2AFabe1e8c109EA156B81175281, 1);
  await invitationContract.onlyOwnerInvite(0xd270F60ac7821F0A5419108E87A13efeeBa0469A, 1);
  await invitationContract.onlyOwnerInvite(0xE8282Fc7340E6767F4f5d8039dB963D86D79ca6C, 1);
  await invitationContract.onlyOwnerInvite(0x2025e555a6cA6C969B1900c80172d2C95FA0fd3B, 1);
  await invitationContract.onlyOwnerInvite(0x941844A79f03BaF34fB0e17f8aa75bcDa1CdAb3E, 1);
  await invitationContract.onlyOwnerInvite(0x6b17D7E1371f0E7D32DA953BEbA1897e12D5Fa43, 1);
  await invitationContract.onlyOwnerInvite(0x9D89B8562B00713a034DEb7A867D5d3Bc45e19E6, 1);
  

  //inspectors
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);

  //activits

  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);  

  //developers

  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);  

  //researchers

  await invitationContract.onlyOwnerInvite(0x, 1);  
  await invitationContract.onlyOwnerInvite(0x, 1);
  await invitationContract.onlyOwnerInvite(0x, 1);
    
  // await invitationContract.renounceOwnership();
} 

async function transferTokens() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  await regenerationCredit.transfer(0x000000000000000, amount);
}

module.exports = afterDeploy;
