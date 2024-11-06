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
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);

  //activits

  await invitationContract.onlyOwnerInvite(0x000000000000, 1);
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  

  //developers

  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  

  //researchers

  await invitationContract.onlyOwnerInvite(0x000000000000, 1);  
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);
  await invitationContract.onlyOwnerInvite(0x000000000000, 1);
    
  // await invitationContract.renounceOwnership();
} 

async function transferTokens() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  //pre-sale investors
  await regenerationCredit.transfer(0x3350933c9063c68Af77c82568Da6E551A70C038d, 1560000);
  await regenerationCredit.transfer(0x10deA15bA7B214Df3Cf019a263b897cA8c2fe8CB, 14184);
  await regenerationCredit.transfer(0x45B4f45225F5c839Db779970627153ab69B9E453, 1063830);
  await regenerationCredit.transfer(0xe2F72B078254E83cE94CC711C3E672E267E2dA69, 70922);
  await regenerationCredit.transfer(0x9E78167097d77cbFBDcF18E89E55A660eE977Dbf, 53191);
  await regenerationCredit.transfer(0x10584a75402fBbB9D2b9239078f8C94fFDed5E1e, 70922);
  await regenerationCredit.transfer(0xc38eF1d3b5915c22CFe9Ec3FC11F953EE4751768, 1773050);
  await regenerationCredit.transfer(0x835dbFd7ac5Db0C556A4416b62B6B67Cb05FDf88, 531915);
  await regenerationCredit.transfer(0x05A6129c3f77db419bD85A6315b95691b212456D, 354610);
  await regenerationCredit.transfer(0x6202401216350f2266c090AA0d1Ca58bAA57fA8E, 354610);
  await regenerationCredit.transfer(0x8b92474120e7D586C8F570902E0e4F5967368597, 354610);
  await regenerationCredit.transfer(0x3e49Ee483A2289946D4992b3A8eEe7aa03e2615B, 177305);
  await regenerationCredit.transfer(0xa16c1B21487281AaFe1Ee64A8385f92afE91bfe6, 354610);
  await regenerationCredit.transfer(0x64b15d21c04acd6b9febded3117829f13e475331, 177305);
  await regenerationCredit.transfer(0x95c4F371055F2c5a130Da0e78B3DF54e7028331e, 106383);
  await regenerationCredit.transfer(0x68CD2862072381F62cfa25701c450B6842690ccB, 100000);
  await regenerationCredit.transfer(0xcDeCe2eEFe17dDb09aD3664b8910e66A17b907F4, 90426);
  await regenerationCredit.transfer(0x1f9B196DA7B2813b3D0C7442E5Ba4C36a7a8E736, 35461);
  await regenerationCredit.transfer(0x25822ca8524Fcd0D7446b167413CE71880A69f43, 17730);
  await regenerationCredit.transfer(0xd672Bbff8726AAD5Df56DDB5f9f8719022DE50cA, 35461);
  await regenerationCredit.transfer(0xaD611ba99d45aF2aA7868FC7DFB346f062a1Dac3, 35461);
  await regenerationCredit.transfer(0xFbF12d63D54b9a9cC68ff2aBFc71EE3567C57B70, 10638);
}

module.exports = afterDeploy;
