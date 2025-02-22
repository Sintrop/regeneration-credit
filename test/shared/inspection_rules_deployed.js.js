const { regenerationCreditDeployed } = require("./regeneration_credit_deployed");
const { userRulesDeployed } = require("./user_contract_deployed");

const inspectionRulesDeployed = async () => {
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;
  const timeBetweenResearches = 6;
  const researcherMaxPenalties = 3;
  const inspectorMaxPenalties = 2;

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 500,
  };

  const sintropArgs = {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 50,
    allowedInitialRequests: 1,
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

  regenerationCredit = await regenerationCreditDeployed();
  userRules = await userRulesDeployed();

  const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
  researcherPool = await researcherPoolFactory.deploy(
    regenerationCredit.target,
    researcherPoolargs.halving,
    researcherPoolargs.blocksPerEra
  );

  const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
  inspectorPool = await inspectorPoolFactory.deploy(
    regenerationCredit.target,
    inspectorPoolargs.halving,
    inspectorPoolargs.blocksPerEra
  );

  const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");
  regeneratorPool = await regeneratorPoolFactory.deploy(
    regenerationCredit.target,
    regeneratorPoolArgs.halving,
    regeneratorPoolArgs.blocksPerEra
  );

  const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
  validatorPool = await validatorPoolFactory.deploy(
    regenerationCredit.target,
    validatorPoolargs.halving,
    validatorPoolargs.blocksPerEra
  );

  const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
  activistPool = await activistPoolFactory.deploy(
    regenerationCredit.target,
    activistPoolArgs.halving,
    activistPoolArgs.blocksPerEra
  );

  const inspectorRulesFactory = await ethers.getContractFactory("InspectorRules");
  const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
  const regeneratorRulesFactory = await ethers.getContractFactory("RegeneratorRules");
  const activistRulesFactory = await ethers.getContractFactory("ActivistRules");

  const validatorRulesFactory = await ethers.getContractFactory("ValidatorRules");
  validatorRules = await validatorRulesFactory.deploy(firstValidatorLimit, secondValidatorLimit);

  inspectorRules = await inspectorRulesFactory.deploy(userRules.target, inspectorPool.target, inspectorMaxPenalties);

  const researcherSecuryBlocksToAnalysis = 10;
  researcherRules = await researcherRulesFactory.deploy(
    userRules.target,
    researcherPool.target,
    validatorRules.target,
    timeBetweenResearches,
    researcherMaxPenalties,
    researcherSecuryBlocksToAnalysis
  );

  regeneratorRules = await regeneratorRulesFactory.deploy(userRules.target, regeneratorPool.target);
  activistRules = await activistRulesFactory.deploy(userRules.target, activistPool.target);

  const regenerationIndexRulesFactory = await ethers.getContractFactory("RegenerationIndexRules");
  regenerationIndexRules = await regenerationIndexRulesFactory.deploy();

  const validatorRulesDependencies = {
    userRulesAddress: userRules.target,
    regeneratorRulesAddress: regeneratorRules.target,
    validatorPoolAddress: validatorPool.target,
    inspectorRulesAddress: inspectorRules.target,
    developerRulesAddress: ZERO_ADDRESS,
    researcherRulesAddress: researcherRules.target,
    contributorRulesAddress: ZERO_ADDRESS,
    activistRulesAddress: activistRules.target,
  };

  const inspectionRulesDependencies = {
    userRulesAddress: userRules.target,
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

  await userRules.newAllowedCaller(inspectorRules.target);
  await userRules.newAllowedCaller(regeneratorRules.target);
  await userRules.newAllowedCaller(researcherRules.target);
  await userRules.newAllowedCaller(validatorRules.target);
  await userRules.newAllowedCaller(activistRules.target);
  await userRules.newAllowedCaller(owner);
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
    userRules,
    regenerationCredit,
    researcherPool,
    inspectorPool,
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
