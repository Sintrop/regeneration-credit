const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  await configureValidationRules();
  await configureInspectionRules();
  await configureDeveloperRules();
  await configureContributorRules();
  await configureResearcherRules();
  await configureActivistRules();
  await configureRegeneratorRules();
  await configureInspectorRules();
  await configureCommunityRules();
  await configurePools();
  await inviteUsers();
  await transferTokens();
  await renounceOwnership();

  console.log("After Deploy OK");
}

async function configureValidationRules() {
  const validationRules = await getDeployedContract("ValidationRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");
  const inspectorRules = await getDeployedContract("InspectorRules");
  const developerRules = await getDeployedContract("DeveloperRules");
  const researcherRules = await getDeployedContract("ResearcherRules");
  const activistRules = await getDeployedContract("ActivistRules");
  const contributorRules = await getDeployedContract("ContributorRules");
  const voteRules = await getDeployedContract("VoteRules");
  const inspectionRules = await getDeployedContract("InspectionRules");

  const contractDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    inspectorRulesAddress: inspectorRules.target,
    developerRulesAddress: developerRules.target,
    researcherRulesAddress: researcherRules.target,
    activistRulesAddress: activistRules.target,
    contributorRulesAddress: contributorRules.target,
    voteRulesAddress: voteRules.target,
  };

  await validationRules.setContractCall(inspectionRules.target, contributorRules.target, developerRules.target, researcherRules.target);
  await validationRules.setContractInterfaces(contractDependencies);
  await regeneratorRules.newAllowedCaller(validationRules.target);
  await inspectorRules.newAllowedCaller(validationRules.target);
  await activistRules.newAllowedCaller(validationRules.target);
  await validationRules.newAllowedCaller(researcherRules.target);
  await validationRules.newAllowedCaller(developerRules.target);
  await validationRules.newAllowedCaller(contributorRules.target);  

  console.log("After ValidationRules deploy is OK");
}

async function configureDeveloperRules() {
  const developerRules = await getDeployedContract("DeveloperRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const developerPool = await getDeployedContract("DeveloperPool");
  const voteRules = await getDeployedContract("VoteRules");

  const contractDependencies = {
    communityRulesAddress: communityRules.target,
    validationRulesAddress: validationRules.target,
    developerPoolAddress: developerPool.target,
    voteRulesAddress: voteRules.target,
  };

  await developerRules.setContractInterfaces(contractDependencies);
  await developerRules.newAllowedCaller(validationRules.target);
  await developerRules.setContractCall(validationRules.target);

  console.log("After DeveloperRules deploy is OK");
}

async function configureContributorRules() {
  const contributorRules = await getDeployedContract("ContributorRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const contributorPool = await getDeployedContract("ContributorPool");
  const voteRules = await getDeployedContract("VoteRules");

  const contractDependencies = {
    communityRulesAddress: communityRules.target,
    validationRulesAddress: validationRules.target,
    contributorPoolAddress: contributorPool.target,
    voteRulesAddress: voteRules.target,
  };

  await contributorRules.setContractInterfaces(contractDependencies);
  await contributorRules.newAllowedCaller(validationRules.target);
  await contributorRules.setContractCall(validationRules.target);

  console.log("After ContributorRules deploy is OK");
}

async function configureResearcherRules() {
  const researcherRules = await getDeployedContract("ResearcherRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const voteRules = await getDeployedContract("VoteRules");

  const contractDependencies = {
    communityRulesAddress: communityRules.target,
    validationRulesAddress: validationRules.target,
    researcherPoolAddress: researcherPool.target,
    voteRulesAddress: voteRules.target,
  };

  await researcherRules.setContractInterfaces(contractDependencies);
  await researcherRules.newAllowedCaller(validationRules.target);
  await researcherRules.setContractCall(validationRules.target);

  console.log("After ResearcherRules deploy is OK");
}

async function configureActivistRules() {

  const inspectionRules = await getDeployedContract("InspectionRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const activistRules = await getDeployedContract("ActivistRules");

  await activistRules.setContractCall(inspectionRules.target, validationRules.target);

  console.log("After ActivistRules deploy is OK");
}

async function configureInspectorRules() {

  const inspectionRules = await getDeployedContract("InspectionRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const inspectorRules = await getDeployedContract("InspectorRules");

  await inspectorRules.setContractCall(inspectionRules.target, validationRules.target);

  console.log("After InspectorRules deploy is OK");
}

async function configureRegeneratorRules() {

  const inspectionRules = await getDeployedContract("InspectionRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");

  await regeneratorRules.setContractCall(inspectionRules.target, validationRules.target);

  console.log("After RegeneratorRules deploy is OK");
}

async function configureCommunityRules() {

  const invitationRules = await getDeployedContract("InvitationRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const communityRules = await getDeployedContract("CommunityRules");

  await communityRules.setContractCall(invitationRules.target, validationRules.target);

  console.log("After CommunityRules deploy is OK");
}

async function configureInspectionRules() {
  const inspectionRules = await getDeployedContract("InspectionRules");
  const inspectorRules = await getDeployedContract("InspectorRules");
  const activistRules = await getDeployedContract("ActivistRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const regenerationIndexRules = await getDeployedContract("RegenerationIndexRules");
  const voteRules = await getDeployedContract("VoteRules");

  const contractDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    validationRulesAddress: validationRules.target,
    inspectorRulesAddress: inspectorRules.target,
    activistRulesAddress: activistRules.target,
    regenerationIndexRulesAddress: regenerationIndexRules.target,
    voteRulesAddress: voteRules.target,
  };

  await inspectionRules.setContractInterfaces(contractDependencies);

  await activistRules.newAllowedCaller(inspectionRules.target);
  await inspectorRules.newAllowedCaller(inspectionRules.target);
  await regeneratorRules.newAllowedCaller(inspectionRules.target);
  await validationRules.newAllowedCaller(inspectionRules.target);

  console.log("After InspectionRules deploy is OK");
}

async function configurePools() {

  const activistPool = await getDeployedContract("ActivistPool");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");
  const inspectorPool = await getDeployedContract("InspectorPool");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const developerPool = await getDeployedContract("DeveloperPool");
  const contributorPool = await getDeployedContract("ContributorPool");
  const activistRules = await getDeployedContract("ActivistRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");
  const developerRules = await getDeployedContract("DeveloperRules");
  const researcherRules = await getDeployedContract("ResearcherRules");
  const contributorRules = await getDeployedContract("ContributorRules");
  const inspectorRules = await getDeployedContract("InspectorRules");

  await activistPool.setContractCall(activistRules.target);
  await contributorPool.setContractCall(contributorRules.target);
  await developerPool.setContractCall(developerRules.target);
  await researcherPool.setContractCall(researcherRules.target);
  await inspectorPool.setContractCall(inspectorRules.target);
  await regeneratorPool.setContractCall(regeneratorRules.target);

  console.log("After configPools is OK");
}

async function renounceOwnership() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");
  const inspectionRules = await getDeployedContract("InspectionRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const inspectorRules = await getDeployedContract("InspectorRules");
  const activistRules = await getDeployedContract("ActivistRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");
  const validationRules = await getDeployedContract("ValidationRules");
  const developerRules = await getDeployedContract("DeveloperRules");
  const researcherRules = await getDeployedContract("ResearcherRules");
  const contributorRules = await getDeployedContract("ContributorRules");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");
  const inspectorPool = await getDeployedContract("InspectorPool");
  const researcherPool = await getDeployedContract("ResearcherPool");
  const developerPool = await getDeployedContract("DeveloperPool");
  const contributorPool = await getDeployedContract("ContributorPool");
  const activistPool = await getDeployedContract("ActivistPool");

  await regenerationCredit.renounceOwnership();
  await inspectionRules.renounceOwnership();
  await communityRules.renounceOwnership();
  await inspectorRules.renounceOwnership();
  await activistRules.renounceOwnership();
  await regeneratorRules.renounceOwnership();
  await validationRules.renounceOwnership();
  await developerRules.renounceOwnership();
  await researcherRules.renounceOwnership();
  await contributorRules.renounceOwnership();
  await regeneratorPool.renounceOwnership();
  await inspectorPool.renounceOwnership();
  await researcherPool.renounceOwnership();
  await developerPool.renounceOwnership();
  await contributorPool.renounceOwnership();
  await activistPool.renounceOwnership();

  console.log("After renounce ownership is OK");
}

async function transferTokens() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  //mainnet - pre-sale investors
  await regenerationCredit.transfer("0x3350933c9063c68Af77c82568Da6E551A70C038d", "1560000000000000000000000");
  await regenerationCredit.transfer("0x10deA15bA7B214Df3Cf019a263b897cA8c2fe8CB", "14184000000000000000000");
  await regenerationCredit.transfer("0x45B4f45225F5c839Db779970627153ab69B9E453", "1063830000000000000000000");
  await regenerationCredit.transfer("0xe2F72B078254E83cE94CC711C3E672E267E2dA69", "70922000000000000000000");
  await regenerationCredit.transfer("0x9E78167097d77cbFBDcF18E89E55A660eE977Dbf", "53191000000000000000000");
  await regenerationCredit.transfer("0x10584a75402fBbB9D2b9239078f8C94fFDed5E1e", "70922000000000000000000");
  await regenerationCredit.transfer("0xc38eF1d3b5915c22CFe9Ec3FC11F953EE4751768", "1773050000000000000000000");
  await regenerationCredit.transfer("0x835dbFd7ac5Db0C556A4416b62B6B67Cb05FDf88", "531915000000000000000000");
  await regenerationCredit.transfer("0x05A6129c3f77db419bD85A6315b95691b212456D", "354610000000000000000000");
  await regenerationCredit.transfer("0x41f8a4536EBd107288beF29044F3Bd81C2CEbf0b", "354610000000000000000000");
  await regenerationCredit.transfer("0x8b92474120e7D586C8F570902E0e4F5967368597", "354610000000000000000000");
  await regenerationCredit.transfer("0x3e49Ee483A2289946D4992b3A8eEe7aa03e2615B", "177305000000000000000000");
  await regenerationCredit.transfer("0xa16c1B21487281AaFe1Ee64A8385f92afE91bfe6", "354610000000000000000000");
  await regenerationCredit.transfer("0x64b15d21c04acd6b9febded3117829f13e475331", "177305000000000000000000");
  await regenerationCredit.transfer("0x95c4F371055F2c5a130Da0e78B3DF54e7028331e", "106383000000000000000000");
  await regenerationCredit.transfer("0x68CD2862072381F62cfa25701c450B6842690ccB", "100000000000000000000000");
  await regenerationCredit.transfer("0xcDeCe2eEFe17dDb09aD3664b8910e66A17b907F4", "90426000000000000000000");
  await regenerationCredit.transfer("0x1f9B196DA7B2813b3D0C7442E5Ba4C36a7a8E736", "55461000000000000000000");
  await regenerationCredit.transfer("0x25822ca8524Fcd0D7446b167413CE71880A69f43", "17730000000000000000000");
  await regenerationCredit.transfer("0xd672Bbff8726AAD5Df56DDB5f9f8719022DE50cA", "35461000000000000000000");
  await regenerationCredit.transfer("0xaD611ba99d45aF2aA7868FC7DFB346f062a1Dac3", "35461000000000000000000");
  await regenerationCredit.transfer("0x01AFF7942F9f27fEEEe98E0203493365e10F5C06", "35461000000000000000000");
  await regenerationCredit.transfer("0xFbF12d63D54b9a9cC68ff2aBFc71EE3567C57B70", "10638000000000000000000");
  await regenerationCredit.transfer("0x0Ef5eF923CF01da31673eeaAB7E63D273b609ca3", "109500000000000000000000");
  await regenerationCredit.transfer("0x137c9547ade09859bF6e8B3C2954482915F629F1", "35461000000000000000000");

  //mainnet - pre-launch contributors
  await regenerationCredit.transfer("0x15a9B50a41121C2bff2D474f361Cb5F50E087f2A", "1000000000000000000000000");
  await regenerationCredit.transfer("0xE6642b52fD8B9FC3a4389FE5473f2C49a2fDA7d9", "500000000000000000000000");
  await regenerationCredit.transfer("0x284a5C0656B5Ca18823F4AcED0E4dfcBF0a5563b", "200000000000000000000000");
  await regenerationCredit.transfer("0xaf6aCf0963EBb984228721d176B1F5b5972F115F", "10000000000000000000000000");
  await regenerationCredit.transfer("0xC94Ed9ee622c17F04D7F99A7046A0dCD53a7cFd5", "2500000000000000000000000");
  await regenerationCredit.transfer("0x382BAd7c1E0b549bedCf1bd525F3D767839D7E94", "5000000000000000000000000");
  await regenerationCredit.transfer("0xeEdc82b741B41b4888d6997Fa1967df710D9c8F3", "2500000000000000000000000");
  await regenerationCredit.transfer("0x33054376f9074C9025Cc275afAa92EC63725D194", "10000000000000000000000000");
  await regenerationCredit.transfer("0xAbEb1652c418d049474ceabf9b224Ec0dEEc4a19", "5000000000000000000000000");
  await regenerationCredit.transfer("0x9Dc5235C5691862b759b85B7eF1Ac6adfbFdb4Fc", "50000000000000000000000");
  await regenerationCredit.transfer("0x3210030eC8114f575b21009319576F9B99126672", "200000000000000000000000");
  await regenerationCredit.transfer("0x6c74D0aEBC1b7379d0089381AE4c5d0660B917C9", "50000000000000000000000");
  await regenerationCredit.transfer("0xe85C393b185d9a57D68A3129E311FdA8eb0622dB", "250000000000000000000000");
  await regenerationCredit.transfer("0xB2223b463282d3e6877e997a60F4b2c0A280DeBE", "25000000000000000000000");
  await regenerationCredit.transfer("0x2e6D3D01Db13b1bFf09570cc52D7F6abafbF6615", "15000000000000000000000000");
  await regenerationCredit.transfer("0x083Ccc7563C62Cf1Ba7cb356E67ff25539B4bc60", "15000000000000000000000000");
  await regenerationCredit.transfer("0x8ef5143F6F933B06A7859aDF9EF19942298c4062", "10000000000000000000000000");
  await regenerationCredit.transfer("0xAF7aEFD875785E25d8423e574C6F724A8a3E1c64", "10000000000000000000000000");
  await regenerationCredit.transfer("0xDAb7f1c57E584a1940E129EBe1ea770DD414ead9", "10000000000000000000000000");
  await regenerationCredit.transfer("0xe38335670B0f8Ce1b7262502E50aCfe454EED2b6", "10000000000000000000000000");
  await regenerationCredit.transfer("0xa7AC50826b7068dB815215d54eA6Ac1B5F7fd8fD", "5000000000000000000000000");
  await regenerationCredit.transfer("0x50b11a99666A66ee649c98397723850d6bb1F1Ca", "5000000000000000000000000");
  await regenerationCredit.transfer("0xf681059129B77500C27e14DF9FF6297a8AE58ed8", "5000000000000000000000000");
  await regenerationCredit.transfer("0x370641C6606960E6FaA32561f7371129E3feA6D1", "5000000000000000000000000");
  await regenerationCredit.transfer("0x1e1A04485259908Ea37D013A1e35150F59D82759", "5000000000000000000000000");
  await regenerationCredit.transfer("0x0BFb33B3F730388af349594520F0a774c76D67BB", "5000000000000000000000000");
  await regenerationCredit.transfer("0x157D079F5D4BD384ab5c343D800e45d230B2F456", "5000000000000000000000000");
  await regenerationCredit.transfer("0xD1a16F1512f6934f27367Dc7A0c2039544b39119", "1560284000000000000000000");

  console.log("After token transfer is OK");
}

async function inviteUsers() {
  const invitationRules = await getDeployedContract("InvitationRules");

  //testnet users
  await invitationRules.onlyOwnerInvite("0x9D89B8562B00713a034DEb7A867D5d3Bc45e19E6", 1);
  await invitationRules.onlyOwnerInvite("0x49B85E2D9F48252BF32BA35221B361DA77AAC683", 4);
  await invitationRules.onlyOwnerInvite("0x219ADF489CF316EA2392827097C5196C437D2C2B", 4);
  await invitationRules.onlyOwnerInvite("0x591900D674AB61C4F69F7D8D81690DBA36608A3C", 3);
  await invitationRules.onlyOwnerInvite("0xE8282FC7340E6767F4F5D8039DB963D86D79CA6C", 1);
  await invitationRules.onlyOwnerInvite("0xF45BFA60B2CB9B519DEA39288A867425445F6330", 4);
  await invitationRules.onlyOwnerInvite("0x798829C56E9BF2AFABE1E8C109EA156B81175281", 1);
  await invitationRules.onlyOwnerInvite("0xF579A3BA6B650449C30682AA5BC1A5E800840A6E", 2);
  await invitationRules.onlyOwnerInvite("0x62E483429F1A79A02BA90685CCD31E6BE43AEB8A", 2);
  await invitationRules.onlyOwnerInvite("0x941844A79F03BAF34FB0E17F8AA75BCDA1CDAB3E", 1);
  await invitationRules.onlyOwnerInvite("0xD18A9E7AE381338940934211B1453CF08918B542", 6);
  await invitationRules.onlyOwnerInvite("0xD270F60AC7821F0A5419108E87A13EFEEBA0469A", 1);
  await invitationRules.onlyOwnerInvite("0xBC13329B98A6A527FB73F6AF721740037DF8BFCF", 3);
  await invitationRules.onlyOwnerInvite("0xA831C9F54F41DA4A8B34D1EC5BA275C7E5BDE8EE", 2);
  await invitationRules.onlyOwnerInvite("0x6B17D7E1371F0E7D32DA953BEBA1897E12D5FA43", 1);
  await invitationRules.onlyOwnerInvite("0x2025E555A6CA6C969B1900C80172D2C95FA0FD3B", 1);
  await invitationRules.onlyOwnerInvite("0xB933B9CF06F2D5EDDFE2E702914B8E102F9DD5CB", 6);
  await invitationRules.onlyOwnerInvite("0x6AE7216E8BD6BA264C1C4983410186E84CB49C13", 3);
  await invitationRules.onlyOwnerInvite("0x0C2D8FCB3A7F1D3D1041A94A2BBA0D6CDD3A9F95", 3);
  await invitationRules.onlyOwnerInvite("0xE2AD367E19B80E409226E830AE870FFF769EA33C", 2);
  await invitationRules.onlyOwnerInvite("0xD9E5E6561DF4C2AFB3596F3E0B5C45963E7F9E76", 1);
  await invitationRules.onlyOwnerInvite("0x4626DBD5C2B902B0D35D5CACAA0BE9FE4A25D27B", 2);
  await invitationRules.onlyOwnerInvite("0x53D88425A4E93138FD9660D21C9AD513DBB0078F", 2);
  await invitationRules.onlyOwnerInvite("0x1FE8BFE5E3E9EBB79F1BBF1B0BAE975BB9A4AA48", 1);
  await invitationRules.onlyOwnerInvite("0x7D038D175AF86B379EC3909F9E86739AE119B93D", 1);
  await invitationRules.onlyOwnerInvite("0x3E8292D7664B14C3C628E2315A834CAE609FD65C", 3);
  await invitationRules.onlyOwnerInvite("0xA6926DC9AF4E639741CED9ABA23FD6879364787B", 8);
  await invitationRules.onlyOwnerInvite("0x44730EE06B2C7A56378F57A93D35136FA610BB91", 8);
  await invitationRules.onlyOwnerInvite("0x900BD2ED98BE55299928AD1DA36B50021EC1856D", 4);

  await invitationRules.onlyOwnerInvite("0x6582110F1b7928e70fdd0e5E6A4b87FC1EF43aA0", 1);
  await invitationRules.onlyOwnerInvite("0x79EA5902CDb137E19B2fc03cD0D3173520efc978", 2);
  await invitationRules.onlyOwnerInvite("0xb4d17556e6Be4d3f0522633824a31199F70135BB", 3);
  await invitationRules.onlyOwnerInvite("0xfFacb421cB11fb4b572C6ED1e2d6014F3d7FBDb4", 5);
  await invitationRules.onlyOwnerInvite("0xb6D6FFE5FC60eb8d6a01e25480B3e6610880BF86", 4);
  await invitationRules.onlyOwnerInvite("0x77760E118B69703AC52BF40F345053812f832fE5", 6);
  
  //mainnet - v6 users
  await invitationRules.onlyOwnerInvite("0xAA863C3B4A0AAF54F42ABE0F627A6F73133003B3", 2);
  await invitationRules.onlyOwnerInvite("0x8D95EB224D5D136726EDFB7C40EA1AD9D03C9FE1", 2);
  await invitationRules.onlyOwnerInvite("0x6C3C648667BCB087D4F5E804D38359A73C28E532", 1);
  await invitationRules.onlyOwnerInvite("0x2A37FDA8978375092457BC1C196643E45C76800D", 2);
  await invitationRules.onlyOwnerInvite("0xAAD8A324900270E4A2588A8A6B68F1A8FB8F9746", 1);
  await invitationRules.onlyOwnerInvite("0x557227DAD75B27C5140A7B4DEB499AE1D48BF1C1", 2);
  await invitationRules.onlyOwnerInvite("0x954B8C950A9F9B6FDF6082033AE741A22FC137D2", 2);
  await invitationRules.onlyOwnerInvite("0x76FC7EDE2C586A49C326DDFAAC0A1AD6F142B737", 1);
  await invitationRules.onlyOwnerInvite("0x96A12B7E8923688FED8DB24175B9D9DD2D9E9FE9", 1);
  await invitationRules.onlyOwnerInvite("0xA29691A22B687F52A7AE5C0D2C985499205AAE72", 2);
  await invitationRules.onlyOwnerInvite("0x2EF4A31CE8E321F0D6E0B36774854AD5369BEF47", 2);
  await invitationRules.onlyOwnerInvite("0xE5A32498FBE559F44FC11FA729D2B8BA2993F5BD", 2);
  await invitationRules.onlyOwnerInvite("0x763DCFA7ECCD155D0D4C232C177B98724659AB27", 1);
  await invitationRules.onlyOwnerInvite("0xF16BD2B7FEDB7AC17E4B6B78FF5CD8992A1AA32E", 1);
  await invitationRules.onlyOwnerInvite("0xF430119F9F1B52B364811504E6B53CAFC5D8477C", 2);
  await invitationRules.onlyOwnerInvite("0x1941B9C833D238764720F3FA712B42C69AEA4A4B", 2);
  await invitationRules.onlyOwnerInvite("0xF5AFE682F4E1326610CCE2E457FC2FA23C62B2E1", 1);
  await invitationRules.onlyOwnerInvite("0xFBF8E793174A05D240E9BC786C0A781A0180E664", 2);
  await invitationRules.onlyOwnerInvite("0x8E9EF6CB758E5155192D4F69D14C333DE9B82B15", 1);
  await invitationRules.onlyOwnerInvite("0xE2E9419E19FCF5D42B1E56BC3A432E1D770044E0", 2);
  await invitationRules.onlyOwnerInvite("0xFB035FFCEE5ECDE602393FCD2ADBA5566DB63C15", 1);
  await invitationRules.onlyOwnerInvite("0x1865FF8BC92568E36981C8EFC4BF97FEDF921048", 2);
  await invitationRules.onlyOwnerInvite("0x47E6C160FE9C1C9C10B89755A0E931056FD71622", 2);
  await invitationRules.onlyOwnerInvite("0x566C073EC7B0D9E9DD1CAF58E74CB954D8CB5DEF", 1);
  await invitationRules.onlyOwnerInvite("0x481FE6C7BC0A9C78D84F9269F41E016D4501FF5C", 3);
  await invitationRules.onlyOwnerInvite("0xB68D8188707C4BBA9882A2A59367251BD5E15B93", 2);
  await invitationRules.onlyOwnerInvite("0xC5ED7768C74221D72BBC28F444CCAE6C0C4057A2", 1);
  await invitationRules.onlyOwnerInvite("0xC7E7CF0BE704FEFF1498AAFA570EC2EF5CB77DDF", 2);
  await invitationRules.onlyOwnerInvite("0xC7B45E9BE3C3EA8CCB8AE6F2E07F7A18B0748BD5", 2);
  await invitationRules.onlyOwnerInvite("0xB0716522ED48B2D19BD654D346128004D5CC2A77", 1);
  await invitationRules.onlyOwnerInvite("0xA05361DF18936F61B89229D8272F4BB2CAA64D5F", 1);
  await invitationRules.onlyOwnerInvite("0x7C460266C3DDE3DBF0D758CF660395AED50DCDD5", 3);
  await invitationRules.onlyOwnerInvite("0xB388AB8D6B078C3A19F800A235871ED19DC93A56", 1);
  await invitationRules.onlyOwnerInvite("0xDEDBD7818F232AEFB981AE4D13C00D23F5AA9280", 2);
  await invitationRules.onlyOwnerInvite("0xEE0546ADBB2FA457FA7245DE3EE93C77C8FE7307", 2);
  await invitationRules.onlyOwnerInvite("0xF34DA23DEC00CA4BB76B1AE33755997D19F6A792", 2);
  await invitationRules.onlyOwnerInvite("0x9DC5235C5691862B759B85B7EF1AC6ADFBFDB4FC", 4);
  await invitationRules.onlyOwnerInvite("0x72FB579F16B78699CB1BF9608BDD0E2ED543A78C", 2);
  await invitationRules.onlyOwnerInvite("0x94DFDBFA8F998BEF11C6E3244E9009747507DC61", 6);
  await invitationRules.onlyOwnerInvite("0xE883DCDB247AA3DC388C0B5ABA8F626E8BAAE3E9", 2);
  await invitationRules.onlyOwnerInvite("0x5A52AE81E9888CC51186579FDB803881C76D6C17", 2);
  await invitationRules.onlyOwnerInvite("0x21D20C5F530DFF1CD0772142E12421CF1484244D", 2);
  await invitationRules.onlyOwnerInvite("0x2EE3BF35A43B1A7651B62254335F5124AC6E48BF", 2);
  await invitationRules.onlyOwnerInvite("0x5ADCFF1B6644866DDD7FAC97FA0B291956B00018", 1);
  await invitationRules.onlyOwnerInvite("0x314B2A64FCF7241A2FB8768A02BB2075326F2400", 1);
  await invitationRules.onlyOwnerInvite("0x379C826182CD893FB9F847CED586EA5CDC98E240", 1);
  await invitationRules.onlyOwnerInvite("0x72482AE19928D654EB6D55F741157AE4701E3ABE", 1);
  await invitationRules.onlyOwnerInvite("0x589F0AF70DDE305F3122FD9E5320B25AA05DFB80", 1);
  await invitationRules.onlyOwnerInvite("0x0387A3AB4865BA5F3D7684E2FA9D8464D76FFC41", 1);
  await invitationRules.onlyOwnerInvite("0x19047B0384384EEA1720DD1A24BA619333454BBF", 1);
  await invitationRules.onlyOwnerInvite("0xA9645F4CF0AD4D218595C9E5182AD273DF2375DF", 4);
  await invitationRules.onlyOwnerInvite("0x82C8F21E1DFBC971BEEC8FE2B234CA2F2B2958D7", 1);
  await invitationRules.onlyOwnerInvite("0xAA48B625CD8130537E7971F83D7BCB7D6AC691A6", 6);
  await invitationRules.onlyOwnerInvite("0x7B1F919AE02FDA3F25DCC9B0660DABD4F59D14E3", 1);
  await invitationRules.onlyOwnerInvite("0x05F29DC5A8259D270ABE4A91E63BFFE7FBBE938A", 1);
  await invitationRules.onlyOwnerInvite("0xDB540F647310BC5B326C6BF7382CFE99807B20DD", 6);
  await invitationRules.onlyOwnerInvite("0x22CB2FC41AC5D57BA62D5BE1183E543D8568EB2A", 6);
  await invitationRules.onlyOwnerInvite("0xA18D9688DF755DE670EE5FB068770C9F5E8712A7", 1);
  await invitationRules.onlyOwnerInvite("0xC200BF12AC0F823751C31FF7ED5534BE4F40FB2A", 4);
  await invitationRules.onlyOwnerInvite("0xC3B0482975E802EF2896ACA0D6B99E11FC26AAAA", 1);
  await invitationRules.onlyOwnerInvite("0xF5275C2E4896F23472F4414AF21EE2BA91EBE16F", 1);
  await invitationRules.onlyOwnerInvite("0xA2E046F3A5E55078944FC2BD9F03C51414055A39", 3);
  await invitationRules.onlyOwnerInvite("0xE85C393B185D9A57D68A3129E311FDA8EB0622DB", 2);
  await invitationRules.onlyOwnerInvite("0xA05F72A230F1E3CC748DEBDCAE5B51EB5FA1A421", 1);
  await invitationRules.onlyOwnerInvite("0x07222D25601F0B116EF2B111207994B2C3208EA7", 3);
  await invitationRules.onlyOwnerInvite("0x8D5AF72C5E375780D5A5A4B1BFC40CBFA68FF886", 2);
  await invitationRules.onlyOwnerInvite("0x1F6AC86D67C7E8840149E6B6071D0E4449432CE6", 1);
  await invitationRules.onlyOwnerInvite("0xD36A3DB2E42F501E04E3EE5045A24A6D422F3DFC", 6);
  await invitationRules.onlyOwnerInvite("0x6F3543055BFF5B6CA01832544E3D3B9546AB63BF", 1);
  await invitationRules.onlyOwnerInvite("0x3190627F339676F190337ABAA98FC2A156DF4E88", 1);
  await invitationRules.onlyOwnerInvite("0xE435384AF4F249D456427F6C76F0D515ED88EE79", 3);
  await invitationRules.onlyOwnerInvite("0x53CE47ABFC5980B4AD1F70F5C31AB42634181FC3", 1);
  await invitationRules.onlyOwnerInvite("0x6A4EA386C9E4F872FFEAF62B1CF5483CC2FA7059", 1);
  await invitationRules.onlyOwnerInvite("0xCF52E65F86ADAF1675F709D34B323BF5E5181401", 3);
  await invitationRules.onlyOwnerInvite("0x228E5544C47B9DE1FE1C2B0D8928E1C98141E0D3", 1);
  await invitationRules.onlyOwnerInvite("0x6D8680B5EB57B5F7E6CCA14A5BA7DA0ED79EEA8D", 1);
  await invitationRules.onlyOwnerInvite("0x04E4A7B8F0855140C73083AEDD73DB0A9C8763E4", 2);
  await invitationRules.onlyOwnerInvite("0xAC3DD98E8025BD37CA653F314B5CBE8492738919", 1);
  await invitationRules.onlyOwnerInvite("0x33A952767CE606E05780707E565D3D26B55CED5C", 2);
  await invitationRules.onlyOwnerInvite("0x7174CF8A665F90056403A9686CBE7515D3A3CBE9", 3);
  await invitationRules.onlyOwnerInvite("0xA57E2C3A8CA5C401D1CD1D649EDAC02B79CBA9FB", 2);
  await invitationRules.onlyOwnerInvite("0x0A5FE7DEFD47B8B700C979F529395FE57671CFAE", 1);
  await invitationRules.onlyOwnerInvite("0x16D7CBE2CB731343CC5AD65B0C4083E9DEA4A7EE", 2);
  await invitationRules.onlyOwnerInvite("0x43EED1234785410619EC5A976CC220F49E57E208", 1);
  await invitationRules.onlyOwnerInvite("0xD0797AA6065D49294DF956FCB153E96D2DA84EB0", 1);
  await invitationRules.onlyOwnerInvite("0x2DD0A2AAA39B60106E6186E422BE3451D4DD0FAA", 1);
  await invitationRules.onlyOwnerInvite("0xB682F70CA22B151266CE66BCDAFF3F1C79F3AE46", 2);
  await invitationRules.onlyOwnerInvite("0x3DCAB804837C944AE7EFE2D0D550802A7ABB07DD", 1);
  await invitationRules.onlyOwnerInvite("0x4A56DDECE357EB131DF8D3A59BECA0B7CD643893", 1);
  await invitationRules.onlyOwnerInvite("0xE9CB014CEEEDCD55FAB7C42202D393CCDE93E41B", 1);

  // await invitationRules.renounceOwnership();
}

module.exports = afterDeploy;
