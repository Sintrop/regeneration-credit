const { regenerationCreditDeployed } = require("./regeneration_credit_deployed");
const { communityRulesDeployed } = require("./user_contract_deployed");
const { ZERO_ADDRESS } = require("./zeroAddress");

const inspectionRulesDeployed = async (owner, args = {}) => {
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;
  const timeBetweenWorks = 6;
  const researcherMaxPenalties = 3;
  const inspectorMaxPenalties = 2;

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 500,
  };

  const sintropArgs = args.sintropArgs || {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 50,
    allowedInitialRequests: 3,
    acceptInspectionDelayBlocks: 5,
    securityBlocksToValidatorAnalysis: 100,
  };

  const researcherPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const inspectorPoolargs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const validatorPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 100,
  };

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 13,
  };

  const regenerationCredit = await regenerationCreditDeployed();
  const communityRules = await communityRulesDeployed();

  const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
  const researcherPool = await researcherPoolFactory.deploy(
    regenerationCredit.target,
    researcherPoolargs.halving,
    researcherPoolargs.blocksPerEra
  );

  const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
  const inspectorPool = await inspectorPoolFactory.deploy(
    regenerationCredit.target,
    inspectorPoolargs.halving,
    inspectorPoolargs.blocksPerEra
  );

  const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");
  const regeneratorPool = await regeneratorPoolFactory.deploy(
    regenerationCredit.target,
    regeneratorPoolArgs.halving,
    regeneratorPoolArgs.blocksPerEra
  );

  const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
  const validatorPool = await validatorPoolFactory.deploy(
    regenerationCredit.target,
    validatorPoolargs.halving,
    validatorPoolargs.blocksPerEra
  );

  const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
  const activistPool = await activistPoolFactory.deploy(
    regenerationCredit.target,
    activistPoolArgs.halving,
    activistPoolArgs.blocksPerEra
  );

  const inspectorRulesFactory = await ethers.getContractFactory("InspectorRules");
  const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
  const regeneratorRulesFactory = await ethers.getContractFactory("RegeneratorRules");
  const activistRulesFactory = await ethers.getContractFactory("ActivistRules");

  const validatorRulesFactory = await ethers.getContractFactory("ValidatorRules");
  const validatorRules = await validatorRulesFactory.deploy(firstValidatorLimit, secondValidatorLimit);

  const inspectorRules = await inspectorRulesFactory.deploy(
    communityRules.target,
    inspectorPool.target,
    inspectorMaxPenalties
  );

  const researcherSecuryBlocksToAnalysis = 10;
  const researcherRules = await researcherRulesFactory.deploy(
    communityRules.target,
    researcherPool.target,
    validatorRules.target,
    timeBetweenWorks,
    researcherMaxPenalties,
    researcherSecuryBlocksToAnalysis
  );

  const regeneratorRules = await regeneratorRulesFactory.deploy(communityRules.target, regeneratorPool.target);
  const activistRules = await activistRulesFactory.deploy(communityRules.target, activistPool.target);

  const regenerationIndexRulesFactory = await ethers.getContractFactory("RegenerationIndexRules");
  regenerationIndexRules = await regenerationIndexRulesFactory.deploy();

  const validatorRulesDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    validatorPoolAddress: validatorPool.target,
    inspectorRulesAddress: inspectorRules.target,
    developerRulesAddress: ZERO_ADDRESS,
    researcherRulesAddress: researcherRules.target,
    contributorRulesAddress: ZERO_ADDRESS,
    activistRulesAddress: activistRules.target,
  };

  const inspectionRulesDependencies = {
    communityRulesAddress: communityRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    validatorRulesAddress: validatorRules.target,
    inspectorRulesAddress: inspectorRules.target,
    activistRulesAddress: activistRules.target,
    regenerationIndexRulesAddress: regenerationIndexRules.target,
  };

  const instanceFactory = await ethers.getContractFactory("InspectionRules");
  instance = await instanceFactory.deploy(
    sintropArgs.timeBetweenInspections,
    sintropArgs.blocksToExpireAcceptedInspection,
    sintropArgs.allowedInitialRequests,
    sintropArgs.acceptInspectionDelayBlocks,
    sintropArgs.securityBlocksToValidatorAnalysis
  );

  await instance.setContractAddressDependencies(inspectionRulesDependencies);
  await validatorRules.setContractAddressDependencies(validatorRulesDependencies);

  await communityRules.newAllowedCaller(inspectorRules.target);
  await communityRules.newAllowedCaller(regeneratorRules.target);
  await communityRules.newAllowedCaller(researcherRules.target);
  await communityRules.newAllowedCaller(validatorRules.target);
  await communityRules.newAllowedCaller(activistRules.target);
  await communityRules.newAllowedCaller(owner);
  await inspectorRules.newAllowedCaller(instance.target);
  await inspectorRules.newAllowedCaller(owner);
  await inspectorRules.newAllowedCaller(validatorRules.target);
  await validatorRules.newAllowedCaller(instance.target);
  await activistRules.newAllowedCaller(instance.target);
  await activistPool.newAllowedCaller(activistRules.target);
  await regeneratorRules.newAllowedCaller(owner);
  await regeneratorRules.newAllowedCaller(instance.target);
  await regeneratorRules.newAllowedCaller(validatorRules.target);
  await regeneratorPool.newAllowedCaller(regeneratorRules.target);
  await inspectorPool.newAllowedCaller(inspectorRules.target);
  await validatorPool.newAllowedCaller(validatorRules.target);
  await regenerationIndexRules.newAllowedCaller(instance.target);

  return {
    instance,
    communityRules,
    regenerationCredit,
    researcherPool,
    inspectorPool,
    regeneratorRules,
    regeneratorPool,
    validatorPool,
    activistPool,
    validatorRules,
    inspectorRules,
    researcherRules,
    activistRules,
    regenerationIndexRules,
  };
};

module.exports = { inspectionRulesDeployed };
