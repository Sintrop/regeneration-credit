const { regenerationCreditDeployed } = require("./regeneration_credit_deployed");
const { communityRulesDeployed } = require("./user_contract_deployed");

const voteRulesDeployed = async () => {
  const timeBetweenVotes = 10;

  const sintropArgs = {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 50,
    allowedInitialRequests: 3,
    acceptInspectionDelayBlocks: 5,
    securityBlocksToValidation_: 100,
  };

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    blocksPerEra: 750,
  };

  const inspectorPoolArgs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    blocksPerEra: 20,
  };

  let developerPoolParams = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 160,
  };

  let researcherPoolParams = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 160,
  };

  let contributorPoolParams = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 160,
  };

  const activistPoolArgs = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 21,
  };

  const regenerationCredit = await regenerationCreditDeployed();
  const communityRules = await communityRulesDeployed();

  const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");
  const regeneratorPool = await regeneratorPoolFactory.deploy(
    regenerationCredit.target,
    regeneratorPoolArgs.halving,
    regeneratorPoolArgs.blocksPerEra
  );

  const regeneratorRulesFactory = await ethers.getContractFactory("RegeneratorRules");
  const regeneratorRules = await regeneratorRulesFactory.deploy(communityRules.target, regeneratorPool.target);

  const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
  const inspectorPool = await inspectorPoolFactory.deploy(
    regenerationCredit.target,
    inspectorPoolArgs.halving,
    inspectorPoolArgs.blocksPerEra
  );

  const developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
  const developerPool = await developerPoolFactory.deploy(
    regenerationCredit.target,
    developerPoolParams.halving,
    developerPoolParams.blocksPerEra
  );

  const reseacherPoolFactory = await ethers.getContractFactory("ResearcherPool");
  const researcherPool = await reseacherPoolFactory.deploy(
    regenerationCredit.target,
    researcherPoolParams.halving,
    researcherPoolParams.blocksPerEra
  );

  const contributorPoolFactory = await ethers.getContractFactory("ContributorPool");
  const contributorPool = await contributorPoolFactory.deploy(
    regenerationCredit.target,
    contributorPoolParams.halving,
    contributorPoolParams.blocksPerEra
  );

  const maxPenalties = 2;
  const inspectorRulesFactory = await ethers.getContractFactory("InspectorRules");
  const inspectorRules = await inspectorRulesFactory.deploy(communityRules.target, inspectorPool.target, maxPenalties);

  const validationRulesFactory = await ethers.getContractFactory("ValidationRules");
  const validationRules = await validationRulesFactory.deploy(timeBetweenVotes);

  const timeBetweenWorks = 10;
  const developerMaxPenalties = 3;
  const developerSecuryBlocksToAnalysis = 10;
  const developerRulesFactory = await ethers.getContractFactory("DeveloperRules");
  const developerRules = await developerRulesFactory.deploy(
    timeBetweenWorks,
    developerMaxPenalties,
    developerSecuryBlocksToAnalysis
  );

  const contributorMaxPenalties = 3;
  const contributorSecuryBlocksToAnalysis = 10;
  const contributorRulesFactory = await ethers.getContractFactory("ContributorRules");
  const contributorRules = await contributorRulesFactory.deploy(
    timeBetweenWorks,
    contributorMaxPenalties,
    contributorSecuryBlocksToAnalysis
  );

  const reseacherMaxPenalties = 3;
  const reseacherTimeBetweenResearches = 10;
  const researcherSecuryBlocksToAnalysis = 10;
  const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
  const researcherRules = await researcherRulesFactory.deploy(
    reseacherTimeBetweenResearches,
    reseacherMaxPenalties,
    researcherSecuryBlocksToAnalysis
  );

  const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
  const activistPool = await activistPoolFactory.deploy(
    regenerationCredit.target,
    activistPoolArgs.halving,
    activistPoolArgs.blocksPerEra
  );

  const activistRulesFactory = await ethers.getContractFactory("ActivistRules");
  const activistRules = await activistRulesFactory.deploy(communityRules.target, activistPool.target);

  const regenerationIndexRulesFactory = await ethers.getContractFactory("RegenerationIndexRules");
  regenerationIndexRules = await regenerationIndexRulesFactory.deploy();

  const voteRulesFactory = await ethers.getContractFactory("VoteRules");
  const voteRules = await voteRulesFactory.deploy(
    communityRules.target,
    activistRules.target,
    contributorRules.target,
    developerRules.target,
    researcherRules.target
  );

  const validationRulesDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    inspectorRulesAddress: inspectorRules.target,
    developerRulesAddress: developerRules.target,
    researcherRulesAddress: researcherRules.target,
    contributorRulesAddress: contributorRules.target,
    activistRulesAddress: activistRules.target,
    voteRulesAddress: voteRules.target,
  };

  const inspectionRulesDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    validationRulesAddress: validationRules.target,
    inspectorRulesAddress: inspectorRules.target,
    activistRulesAddress: activistRules.target,
    regenerationIndexRulesAddress: regenerationIndexRules.target,
    voteRulesAddress: voteRules.target,
  };

  const inspectionRulesFactory = await ethers.getContractFactory("InspectionRules");
  const inspectionRules = await inspectionRulesFactory.deploy(
    sintropArgs.timeBetweenInspections,
    sintropArgs.blocksToExpireAcceptedInspection,
    sintropArgs.allowedInitialRequests,
    sintropArgs.acceptInspectionDelayBlocks,
    sintropArgs.securityBlocksToValidation_
  );

  await inspectionRules.setContractInterfaces(inspectionRulesDependencies);

  await activistPool.newAllowedCaller(activistRules.target);
  await researcherPool.newAllowedCaller(researcherRules.target);

  await validationRules.setContractInterfaces(validationRulesDependencies);

  const developerRulesContractDependencies = {
    communityRulesAddress: communityRules.target,
    developerPoolAddress: developerPool.target,
    validationRulesAddress: validationRules.target,
    voteRulesAddress: voteRules.target,
  };

  await developerRules.setContractInterfaces(developerRulesContractDependencies);

  const contributorRulesContractDependencies = {
    communityRulesAddress: communityRules.target,
    contributorPoolAddress: contributorPool.target,
    validationRulesAddress: validationRules.target,
    voteRulesAddress: voteRules.target,
  };

  await contributorRules.setContractInterfaces(contributorRulesContractDependencies);

  const researcherRulesContractDependencies = {
    communityRulesAddress: communityRules.target,
    researcherPoolAddress: researcherPool.target,
    validationRulesAddress: validationRules.target,
    voteRulesAddress: voteRules.target,
  };

  await researcherRules.setContractInterfaces(researcherRulesContractDependencies);

  return {
    activistRules,
    activistPool,
    regenerationCredit,
    communityRules,
    contributorRules,
    contributorPool,
    regeneratorRules,
    inspectorRules,
    inspectorPool,
    inspectionRules,
    developerRules,
    developerPool,
    researcherRules,
    researcherPool,
    regeneratorRules,
    regeneratorPool,
    voteRules,
    validationRules,
    regenerationIndexRules,
  };
};

module.exports = { voteRulesDeployed };
