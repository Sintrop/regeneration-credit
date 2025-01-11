const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function afterDeploy() {
  await configureValidatorContract();
  await configureSintrop();
  await addCategories();
  await renounceOwnership();
  await inviteUsers();
  await transferTokens();
  await offsetEnergy();

  console.log("After Deploy OK");
}

async function configureValidatorContract() {
  const validatorContract = await getDeployedContract("ValidatorContract");
  const userContract = await getDeployedContract("UserContract");
  const validatorPool = await getDeployedContract("ValidatorPool");
  const regeneratorContract = await getDeployedContract("RegeneratorContract");
  const inspectorContract = await getDeployedContract("InspectorContract");
  const developerContract = await getDeployedContract("DeveloperContract");
  const researcherContract = await getDeployedContract("ResearcherContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const contributorContract = await getDeployedContract("ContributorContract");

  const contractDependencies = {
    userContractAddress: userContract.target,
    regeneratorContractAddress: regeneratorContract.target,
    validatorPoolAddress: validatorPool.target,
    inspectorContractAddress: inspectorContract.target,
    developerContractAddress: developerContract.target,
    researcherContractAddress: researcherContract.target,
    activistContractAddress: activistContract.target,
    contributorContractAddress: contributorContract
  };

  await validatorContract.setContractAddressDependencies(contractDependencies);
  await regeneratorContract.newAllowedCaller(validatorContract.target);
  await validatorPool.newAllowedCaller(validatorContract.target);
  await inspectorContract.newAllowedCaller(validatorContract.target);

  console.log("After ValidatorContract deploy is OK");
}


async function configureSintrop() {
  const sintrop = await getDeployedContract("Sintrop");
  const inspectorContract = await getDeployedContract("InspectorContract");
  const activistContract = await getDeployedContract("ActivistContract");
  const userContract = await getDeployedContract("UserContract");
  const regeneratorContract = await getDeployedContract("RegeneratorContract");
  const validatorContract = await getDeployedContract("ValidatorContract");
  const categoryContract = await getDeployedContract("CategoryContract");

  const contractDependencies = {
    userContractAddress: userContract.target,
    regeneratorContractAddress: regeneratorContract.target,
    validatorContractAddress: validatorContract.target,
    inspectorContractAddress: inspectorContract.target,
    activistContractAddress: activistContract.target,
    categoryContractAddress: categoryContract.target
  };

  await sintrop.setContractAddressDependencies(contractDependencies);

  await activistContract.newAllowedCaller(sintrop.target);
  await inspectorContract.newAllowedCaller(sintrop.target);
  await regeneratorContract.newAllowedCaller(sintrop.target);
  await userContract.newAllowedCaller(sintrop.target);
  await validatorContract.newAllowedCaller(sintrop.target);
  await categoryContract.newAllowedCaller(sintrop.target);

  console.log("After Sintrop deploy is OK");
}

async function addCategories() {
  const categoryContract = await getDeployedContract("CategoryContract");

  await categoryContract.addCategory("Carbon", "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]", [
    {
      regenerationIndexId: 1, 
      description: "Balance > 100.000"
    },
    {
      regenerationIndexId: 2, 
      description: "100.000 > Balance > 10.000"
    },
    {
      regenerationIndexId: 3, 
      description: "10.000 > Balance > 1000"
    },
    {
      regenerationIndexId: 4, 
      description: "1000 > Balance > 100"
    },
    {
      regenerationIndexId: 5, 
      description: "100 > Balance > 10"
    },
    {
      regenerationIndexId: 6, 
      description: "10 > Balance > 0"
    },
    {
      regenerationIndexId: 7, 
      description: "Not applicable"
    },
    {
      regenerationIndexId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      regenerationIndexId: 9, 
      description: "-100 < Balance < -10"
    },
    {
      regenerationIndexId: 10, 
      description: "-1.000 < Balance < -100"
    },
    {
      regenerationIndexId: 11, 
      description: "-10.000 < Balance < -1.000"
    },
    {
      regenerationIndexId: 12, 
      description: "-100.000 < Balance < -10.000"
    },
    {
      regenerationIndexId: 13, 
      description: "Balance < -100.000"
    },
  ])

  await categoryContract.addCategory("Soil", "Indicator to measure impact of soil. Balance = regenerating soil - degradation soil [ha]", [
    {
      regenerationIndexId: 1, 
      description: "Balance > 1000"
    },
    {
      regenerationIndexId: 2, 
      description: "1000 > Balance > 100"
    },
    {
      regenerationIndexId: 3, 
      description: "100 > Balance > 10"
    },
    {
      regenerationIndexId: 4, 
      description: "10 > Balance > 2"
    },
    {
      regenerationIndexId: 5, 
      description: "2 > Balance > 1"
    },
    {
      regenerationIndexId: 6, 
      description: "1 > Balance > 0"
    },
    {
      regenerationIndexId: 7, 
      description: "Not applicable"
    },
    {
      regenerationIndexId: 8, 
      description: "-1 < Balance < 0"
    },
    {
      regenerationIndexId: 9, 
      description: "-2 < Balance < -1"
    },
    {
      regenerationIndexId: 10, 
      description: "-10 < Balance < -2"
    },
    {
      regenerationIndexId: 11, 
      description: "-100 < Balance < -10"
    },
    {
      regenerationIndexId: 12, 
      description: "-1000 < Balance < -100"
    },
    {
      regenerationIndexId: 13, 
      description: "Balance < -1000"
    },
  ])
  await categoryContract.addCategory("Water", "Indicator to measure water balance. Balance = vegetation water impact + self harvest water - used water [m3]", [
    {
      regenerationIndexId: 1, 
      description: "Balance > 100.000"
    },
    {
      regenerationIndexId: 2, 
      description: "100.000 > Balance > 10.000"
    },
    {
      regenerationIndexId: 3, 
      description: "10.000 > Balance > 1000"
    },
    {
      regenerationIndexId: 4, 
      description: "1000 > Balance > 100"
    },
    {
      regenerationIndexId: 5, 
      description: "100 > Balance > 10"
    },
    {
      regenerationIndexId: 6, 
      description: "10 > Balance > 0"
    },
    {
      regenerationIndexId: 7, 
      description: "Not applicable"
    },
    {
      regenerationIndexId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      regenerationIndexId: 9, 
      description: "-100 < Balance < -10"
    },
    {
      regenerationIndexId: 10, 
      description: "-1.000 < Balance < -100"
    },
    {
      regenerationIndexId: 11, 
      description: "-10.000 < Balance < -1.000"
    },
    {
      regenerationIndexId: 12, 
      description: "-100.000 < Balance < -10.000"
    },
    {
      regenerationIndexId: 13, 
      description: "Balance < -100.000"
    },
  ])

  await categoryContract.addCategory("Biodiversity", "Indicator to measure the level of plant and animal biodiversity. Our unit is 'unit of life', meaning one species of fauna and flora. Balance = ul restored - ul destroyed. [ul].", [
    {
      regenerationIndexId: 1, 
      description: "Balance > 1000"
    },
    {
      regenerationIndexId: 2, 
      description: "1000 > Balance > 200"
    },
    {
      regenerationIndexId: 3, 
      description: "200 > Balance > 100"
    },
    {
      regenerationIndexId: 4, 
      description: "100 > Balance > 50"
    },
    {
      regenerationIndexId: 5, 
      description: "50 > Balance > 10"
    },
    {
      regenerationIndexId: 6, 
      description: "10 > Balance > 0"
    },
    {
      regenerationIndexId: 7, 
      description: "Not applicable"
    },
    {
      regenerationIndexId: 8, 
      description: "-10 < Balance < 0"
    },
    {
      regenerationIndexId: 9, 
      description: "-50 < Balance < -10"
    },
    {
      regenerationIndexId: 10, 
      description: "-100 < Balance < -50"
    },
    {
      regenerationIndexId: 11, 
      description: "-200 < Balance < -100"
    },
    {
      regenerationIndexId: 12, 
      description: "-1.000 < Balance < -200"
    },
    {
      regenerationIndexId: 13, 
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
  const regeneratorContract = await getDeployedContract("RegeneratorContract");
  const validatorContract = await getDeployedContract("ValidatorContract");
  const developerContract = await getDeployedContract("DeveloperContract");
  const researcherContract = await getDeployedContract("ResearcherContract");
  const contributorContract = await getDeployedContract("ContributorContract");
  const regeneratorPool = await getDeployedContract("RegeneratorPool");
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
  await regeneratorContract.renounceOwnership();
  await validatorContract.renounceOwnership();
  await developerContract.renounceOwnership();
  await researcherContract.renounceOwnership();
  await contributorContract.renounceOwnership();
  await regeneratorPool.renounceOwnership();
  await inspectorPool.renounceOwnership();
  await researcherPool.renounceOwnership();
  await developerPool.renounceOwnership();
  await contributorPool.renounceOwnership();
  await activistPool.renounceOwnership();
  await validatorPool.renounceOwnership();

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
  await regenerationCredit.transfer("0x6202401216350f2266c090AA0d1Ca58bAA57fA8E", "354610000000000000000000");
  await regenerationCredit.transfer("0x8b92474120e7D586C8F570902E0e4F5967368597", "354610000000000000000000");
  await regenerationCredit.transfer("0x3e49Ee483A2289946D4992b3A8eEe7aa03e2615B", "177305000000000000000000");
  await regenerationCredit.transfer("0xa16c1B21487281AaFe1Ee64A8385f92afE91bfe6", "354610000000000000000000");
  await regenerationCredit.transfer("0x64b15d21c04acd6b9febded3117829f13e475331", "177305000000000000000000");
  await regenerationCredit.transfer("0x95c4F371055F2c5a130Da0e78B3DF54e7028331e", "106383000000000000000000");
  await regenerationCredit.transfer("0x68CD2862072381F62cfa25701c450B6842690ccB", "100000000000000000000000");
  await regenerationCredit.transfer("0xcDeCe2eEFe17dDb09aD3664b8910e66A17b907F4", "90426000000000000000000");
  await regenerationCredit.transfer("0x1f9B196DA7B2813b3D0C7442E5Ba4C36a7a8E736", "35461000000000000000000");
  await regenerationCredit.transfer("0x25822ca8524Fcd0D7446b167413CE71880A69f43", "17730000000000000000000");
  await regenerationCredit.transfer("0xd672Bbff8726AAD5Df56DDB5f9f8719022DE50cA", "35461000000000000000000");
  await regenerationCredit.transfer("0xaD611ba99d45aF2aA7868FC7DFB346f062a1Dac3", "35461000000000000000000");
  await regenerationCredit.transfer("0x01AFF7942F9f27fEEEe98E0203493365e10F5C06", "35461000000000000000000");
  await regenerationCredit.transfer("0xFbF12d63D54b9a9cC68ff2aBFc71EE3567C57B70", "10638000000000000000000");
  await regenerationCredit.transfer("0x0Ef5eF923CF01da31673eeaAB7E63D273b609ca3", "109500000000000000000000");

  console.log("After token transfer is OK");
}

async function inviteUsers() {
  const invitationContract = await getDeployedContract("InvitationContract");

  //testnet - v8 users
  await invitationContract.onlyOwnerInvite("0x9D89B8562B00713a034DEb7A867D5d3Bc45e19E6", 1);  
  await invitationContract.onlyOwnerInvite("0x49B85E2D9F48252BF32BA35221B361DA77AAC683", 4);
  await invitationContract.onlyOwnerInvite("0x219ADF489CF316EA2392827097C5196C437D2C2B", 4);
  await invitationContract.onlyOwnerInvite("0x591900D674AB61C4F69F7D8D81690DBA36608A3C", 3);
  await invitationContract.onlyOwnerInvite("0xE8282FC7340E6767F4F5D8039DB963D86D79CA6C", 1);
  await invitationContract.onlyOwnerInvite("0xF45BFA60B2CB9B519DEA39288A867425445F6330", 4);
  await invitationContract.onlyOwnerInvite("0x798829C56E9BF2AFABE1E8C109EA156B81175281", 1);
  await invitationContract.onlyOwnerInvite("0xF579A3BA6B650449C30682AA5BC1A5E800840A6E", 2);
  await invitationContract.onlyOwnerInvite("0x62E483429F1A79A02BA90685CCD31E6BE43AEB8A", 2);
  await invitationContract.onlyOwnerInvite("0x941844A79F03BAF34FB0E17F8AA75BCDA1CDAB3E", 1);
  await invitationContract.onlyOwnerInvite("0xD18A9E7AE381338940934211B1453CF08918B542", 6);
  await invitationContract.onlyOwnerInvite("0xD270F60AC7821F0A5419108E87A13EFEEBA0469A", 1);
  await invitationContract.onlyOwnerInvite("0xBC13329B98A6A527FB73F6AF721740037DF8BFCF", 3);
  await invitationContract.onlyOwnerInvite("0xA831C9F54F41DA4A8B34D1EC5BA275C7E5BDE8EE", 2);
  await invitationContract.onlyOwnerInvite("0x6B17D7E1371F0E7D32DA953BEBA1897E12D5FA43", 1);
  await invitationContract.onlyOwnerInvite("0x2025E555A6CA6C969B1900C80172D2C95FA0FD3B", 1);
  await invitationContract.onlyOwnerInvite("0xB933B9CF06F2D5EDDFE2E702914B8E102F9DD5CB", 6);
  await invitationContract.onlyOwnerInvite("0x6AE7216E8BD6BA264C1C4983410186E84CB49C13", 3);
  await invitationContract.onlyOwnerInvite("0x0C2D8FCB3A7F1D3D1041A94A2BBA0D6CDD3A9F95", 3);
  await invitationContract.onlyOwnerInvite("0xE2AD367E19B80E409226E830AE870FFF769EA33C", 2);
  await invitationContract.onlyOwnerInvite("0xD9E5E6561DF4C2AFB3596F3E0B5C45963E7F9E76", 1);
  await invitationContract.onlyOwnerInvite("0x4626DBD5C2B902B0D35D5CACAA0BE9FE4A25D27B", 2);
  await invitationContract.onlyOwnerInvite("0x53D88425A4E93138FD9660D21C9AD513DBB0078F", 2);
  await invitationContract.onlyOwnerInvite("0x1FE8BFE5E3E9EBB79F1BBF1B0BAE975BB9A4AA48", 1);
  await invitationContract.onlyOwnerInvite("0x7D038D175AF86B379EC3909F9E86739AE119B93D", 1);
  await invitationContract.onlyOwnerInvite("0x3E8292D7664B14C3C628E2315A834CAE609FD65C", 3);
  await invitationContract.onlyOwnerInvite("0xA6926DC9AF4E639741CED9ABA23FD6879364787B", 8);
  await invitationContract.onlyOwnerInvite("0x44730EE06B2C7A56378F57A93D35136FA610BB91", 8);
  await invitationContract.onlyOwnerInvite("0x900BD2ED98BE55299928AD1DA36B50021EC1856D", 4);
  
  //mainnet - v6 users
  await invitationContract.onlyOwnerInvite("0xAA863C3B4A0AAF54F42ABE0F627A6F73133003B3", 2);
  await invitationContract.onlyOwnerInvite("0x8D95EB224D5D136726EDFB7C40EA1AD9D03C9FE1", 2);
  await invitationContract.onlyOwnerInvite("0x6C3C648667BCB087D4F5E804D38359A73C28E532", 1);
  await invitationContract.onlyOwnerInvite("0x2A37FDA8978375092457BC1C196643E45C76800D", 2);
  await invitationContract.onlyOwnerInvite("0xAAD8A324900270E4A2588A8A6B68F1A8FB8F9746", 1);
  await invitationContract.onlyOwnerInvite("0x557227DAD75B27C5140A7B4DEB499AE1D48BF1C1", 2);
  await invitationContract.onlyOwnerInvite("0x954B8C950A9F9B6FDF6082033AE741A22FC137D2", 2);
  await invitationContract.onlyOwnerInvite("0x76FC7EDE2C586A49C326DDFAAC0A1AD6F142B737", 1);
  await invitationContract.onlyOwnerInvite("0x96A12B7E8923688FED8DB24175B9D9DD2D9E9FE9", 1);
  await invitationContract.onlyOwnerInvite("0xA29691A22B687F52A7AE5C0D2C985499205AAE72", 2);
  await invitationContract.onlyOwnerInvite("0x2EF4A31CE8E321F0D6E0B36774854AD5369BEF47", 2);
  await invitationContract.onlyOwnerInvite("0xE5A32498FBE559F44FC11FA729D2B8BA2993F5BD", 2);
  await invitationContract.onlyOwnerInvite("0x763DCFA7ECCD155D0D4C232C177B98724659AB27", 1);
  await invitationContract.onlyOwnerInvite("0xF16BD2B7FEDB7AC17E4B6B78FF5CD8992A1AA32E", 1);
  await invitationContract.onlyOwnerInvite("0xF430119F9F1B52B364811504E6B53CAFC5D8477C", 2);
  await invitationContract.onlyOwnerInvite("0x1941B9C833D238764720F3FA712B42C69AEA4A4B", 2);
  await invitationContract.onlyOwnerInvite("0xF5AFE682F4E1326610CCE2E457FC2FA23C62B2E1", 1);
  await invitationContract.onlyOwnerInvite("0xFBF8E793174A05D240E9BC786C0A781A0180E664", 2);
  await invitationContract.onlyOwnerInvite("0x8E9EF6CB758E5155192D4F69D14C333DE9B82B15", 1);
  await invitationContract.onlyOwnerInvite("0xE2E9419E19FCF5D42B1E56BC3A432E1D770044E0", 2);
  await invitationContract.onlyOwnerInvite("0xFB035FFCEE5ECDE602393FCD2ADBA5566DB63C15", 1);
  await invitationContract.onlyOwnerInvite("0x1865FF8BC92568E36981C8EFC4BF97FEDF921048", 2);
  await invitationContract.onlyOwnerInvite("0x47E6C160FE9C1C9C10B89755A0E931056FD71622", 2);
  await invitationContract.onlyOwnerInvite("0x566C073EC7B0D9E9DD1CAF58E74CB954D8CB5DEF", 1);
  await invitationContract.onlyOwnerInvite("0x481FE6C7BC0A9C78D84F9269F41E016D4501FF5C", 3);
  await invitationContract.onlyOwnerInvite("0xB68D8188707C4BBA9882A2A59367251BD5E15B93", 2);
  await invitationContract.onlyOwnerInvite("0xC5ED7768C74221D72BBC28F444CCAE6C0C4057A2", 1);
  await invitationContract.onlyOwnerInvite("0xC7E7CF0BE704FEFF1498AAFA570EC2EF5CB77DDF", 2);
  await invitationContract.onlyOwnerInvite("0xC7B45E9BE3C3EA8CCB8AE6F2E07F7A18B0748BD5", 2);
  await invitationContract.onlyOwnerInvite("0xB0716522ED48B2D19BD654D346128004D5CC2A77", 1);
  await invitationContract.onlyOwnerInvite("0xA05361DF18936F61B89229D8272F4BB2CAA64D5F", 1);
  await invitationContract.onlyOwnerInvite("0x7C460266C3DDE3DBF0D758CF660395AED50DCDD5", 3);
  await invitationContract.onlyOwnerInvite("0xB388AB8D6B078C3A19F800A235871ED19DC93A56", 1);
  await invitationContract.onlyOwnerInvite("0xDEDBD7818F232AEFB981AE4D13C00D23F5AA9280", 2);
  await invitationContract.onlyOwnerInvite("0xEE0546ADBB2FA457FA7245DE3EE93C77C8FE7307", 2);
  await invitationContract.onlyOwnerInvite("0xF34DA23DEC00CA4BB76B1AE33755997D19F6A792", 2);
  await invitationContract.onlyOwnerInvite("0x9DC5235C5691862B759B85B7EF1AC6ADFBFDB4FC", 4);
  await invitationContract.onlyOwnerInvite("0x72FB579F16B78699CB1BF9608BDD0E2ED543A78C", 2);
  await invitationContract.onlyOwnerInvite("0x94DFDBFA8F998BEF11C6E3244E9009747507DC61", 6);
  await invitationContract.onlyOwnerInvite("0xE883DCDB247AA3DC388C0B5ABA8F626E8BAAE3E9", 2);
  await invitationContract.onlyOwnerInvite("0x5A52AE81E9888CC51186579FDB803881C76D6C17", 2);
  await invitationContract.onlyOwnerInvite("0x21D20C5F530DFF1CD0772142E12421CF1484244D", 2);
  await invitationContract.onlyOwnerInvite("0x2EE3BF35A43B1A7651B62254335F5124AC6E48BF", 2);
  await invitationContract.onlyOwnerInvite("0x5ADCFF1B6644866DDD7FAC97FA0B291956B00018", 1);
  await invitationContract.onlyOwnerInvite("0x314B2A64FCF7241A2FB8768A02BB2075326F2400", 1);
  await invitationContract.onlyOwnerInvite("0x379C826182CD893FB9F847CED586EA5CDC98E240", 1);
  await invitationContract.onlyOwnerInvite("0x72482AE19928D654EB6D55F741157AE4701E3ABE", 1);
  await invitationContract.onlyOwnerInvite("0x589F0AF70DDE305F3122FD9E5320B25AA05DFB80", 1);
  await invitationContract.onlyOwnerInvite("0x0387A3AB4865BA5F3D7684E2FA9D8464D76FFC41", 1);
  await invitationContract.onlyOwnerInvite("0x19047B0384384EEA1720DD1A24BA619333454BBF", 1);
  await invitationContract.onlyOwnerInvite("0xA9645F4CF0AD4D218595C9E5182AD273DF2375DF", 4);
  await invitationContract.onlyOwnerInvite("0x82C8F21E1DFBC971BEEC8FE2B234CA2F2B2958D7", 1);
  await invitationContract.onlyOwnerInvite("0xAA48B625CD8130537E7971F83D7BCB7D6AC691A6", 6);
  await invitationContract.onlyOwnerInvite("0x7B1F919AE02FDA3F25DCC9B0660DABD4F59D14E3", 1);
  await invitationContract.onlyOwnerInvite("0x05F29DC5A8259D270ABE4A91E63BFFE7FBBE938A", 1);
  await invitationContract.onlyOwnerInvite("0xDB540F647310BC5B326C6BF7382CFE99807B20DD", 6);
  await invitationContract.onlyOwnerInvite("0x22CB2FC41AC5D57BA62D5BE1183E543D8568EB2A", 6);
  await invitationContract.onlyOwnerInvite("0xA18D9688DF755DE670EE5FB068770C9F5E8712A7", 1);
  await invitationContract.onlyOwnerInvite("0xC200BF12AC0F823751C31FF7ED5534BE4F40FB2A", 4);
  await invitationContract.onlyOwnerInvite("0xC3B0482975E802EF2896ACA0D6B99E11FC26AAAA", 1);
  await invitationContract.onlyOwnerInvite("0xF5275C2E4896F23472F4414AF21EE2BA91EBE16F", 1);
  await invitationContract.onlyOwnerInvite("0xA2E046F3A5E55078944FC2BD9F03C51414055A39", 3);
  await invitationContract.onlyOwnerInvite("0xE85C393B185D9A57D68A3129E311FDA8EB0622DB", 2);
  await invitationContract.onlyOwnerInvite("0xA05F72A230F1E3CC748DEBDCAE5B51EB5FA1A421", 1);
  await invitationContract.onlyOwnerInvite("0x07222D25601F0B116EF2B111207994B2C3208EA7", 3);
  await invitationContract.onlyOwnerInvite("0x8D5AF72C5E375780D5A5A4B1BFC40CBFA68FF886", 2);
  await invitationContract.onlyOwnerInvite("0x1F6AC86D67C7E8840149E6B6071D0E4449432CE6", 1);
  await invitationContract.onlyOwnerInvite("0xD36A3DB2E42F501E04E3EE5045A24A6D422F3DFC", 6);
  await invitationContract.onlyOwnerInvite("0x6F3543055BFF5B6CA01832544E3D3B9546AB63BF", 1);
  await invitationContract.onlyOwnerInvite("0x3190627F339676F190337ABAA98FC2A156DF4E88", 1);
  await invitationContract.onlyOwnerInvite("0xE435384AF4F249D456427F6C76F0D515ED88EE79", 3);
  await invitationContract.onlyOwnerInvite("0x53CE47ABFC5980B4AD1F70F5C31AB42634181FC3", 1);
  await invitationContract.onlyOwnerInvite("0x6A4EA386C9E4F872FFEAF62B1CF5483CC2FA7059", 1);
  await invitationContract.onlyOwnerInvite("0xCF52E65F86ADAF1675F709D34B323BF5E5181401", 3);
  await invitationContract.onlyOwnerInvite("0x228E5544C47B9DE1FE1C2B0D8928E1C98141E0D3", 1);
  await invitationContract.onlyOwnerInvite("0x6D8680B5EB57B5F7E6CCA14A5BA7DA0ED79EEA8D", 1);
  await invitationContract.onlyOwnerInvite("0x04E4A7B8F0855140C73083AEDD73DB0A9C8763E4", 2);
  await invitationContract.onlyOwnerInvite("0xAC3DD98E8025BD37CA653F314B5CBE8492738919", 1);
  await invitationContract.onlyOwnerInvite("0x33A952767CE606E05780707E565D3D26B55CED5C", 2);
  await invitationContract.onlyOwnerInvite("0x7174CF8A665F90056403A9686CBE7515D3A3CBE9", 3);
  await invitationContract.onlyOwnerInvite("0xA57E2C3A8CA5C401D1CD1D649EDAC02B79CBA9FB", 2);
  await invitationContract.onlyOwnerInvite("0x0A5FE7DEFD47B8B700C979F529395FE57671CFAE", 1);
  await invitationContract.onlyOwnerInvite("0x16D7CBE2CB731343CC5AD65B0C4083E9DEA4A7EE", 2);
  await invitationContract.onlyOwnerInvite("0x43EED1234785410619EC5A976CC220F49E57E208", 1);
  await invitationContract.onlyOwnerInvite("0xD0797AA6065D49294DF956FCB153E96D2DA84EB0", 1);
  await invitationContract.onlyOwnerInvite("0x2DD0A2AAA39B60106E6186E422BE3451D4DD0FAA", 1);
  await invitationContract.onlyOwnerInvite("0xB682F70CA22B151266CE66BCDAFF3F1C79F3AE46", 2);
  await invitationContract.onlyOwnerInvite("0x3DCAB804837C944AE7EFE2D0D550802A7ABB07DD", 1);
  await invitationContract.onlyOwnerInvite("0x4A56DDECE357EB131DF8D3A59BECA0B7CD643893", 1);
  await invitationContract.onlyOwnerInvite("0xE9CB014CEEEDCD55FAB7C42202D393CCDE93E41B", 1);

  // await invitationContract.renounceOwnership();
} 

async function offsetEnergy() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");

  await regenerationCredit.burnTokens("124500000000000000000000000");

  console.log("After offset is OK");
}

module.exports = afterDeploy;
