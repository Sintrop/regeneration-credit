const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");

describe("ValidatorRules", () => {
  let instance;
  let communityRules;
  let regeneratorRules;
  let regeneratorPool;
  let validatorPool;
  let inspectorPool;
  let researcherPool;
  let activistPool;
  let activistRules;
  let inspectorRules;
  let developerRules;
  let researcherRules;
  let contributorRules;
  let regenerationCredit;

  let owner,
    regenerator1Address,
    regenerator2Address,
    inspector1Address,
    inspector2Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    validator5Address,
    validator6Address,
    validator7Address,
    validator8Address,
    validator9Address,
    validator10Address,
    validator11Address,
    validator12Address,
    validator13Address,
    validator14Address,
    validator15Address,
    contributor1Address,
    contributor2Address,
    dev1Address,
    dev2Address,
    otherAddress,
    resea1Address,
    resea2Address,
    activist1Address,
    activist2Address;

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const validatorPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 80,
  };

  const inspectorPoolArgs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    blocksPerEra: 20,
  };

  let developerPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 45,
  };

  let researcherPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 40,
  };

  let contributorPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 40,
  };

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 20,
  };

  const addDeveloper = async (name, from) => {
    await developerRules.connect(from).addDeveloper(name, "photoURL");
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
  };

  const addContributor = async (name, from) => {
    await contributorRules.connect(from).addContributor(name, "photoURL");
  };

  const addValidator = async (from) => {
    await instance.connect(from).addValidator();
  };

  const addActivist = async (name, from) => {
    await activistRules.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const addRegenerator = async (name, from) => {
    await regeneratorRules.connect(from).addRegenerator(1000, name, "photoURL", coordinates());
  };

  const coordinates = () => {
    return [
      {
        latitude: "-22.912554",
        longitude: "-44.4925355",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912555",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925373",
      },
    ];
  };

  const addInspector = async (name, from) => {
    await inspectorRules.connect(from).addInspector(name, "photoURL");
  };

  const addResearch = async (from) => {
    await researcherRules.connect(from).addResearch("title", "thesis", "fileURL");
  };

  const denyUser = async (userAddress) => {
    await communityRules.setDeniedType(userAddress);
  };

  const generateReportObject = (report) => {
    return {
      id: report.id,
      era: report.era,
      developer: report.developer,
      level: report.level,
      description: report.description,
      report: report.report,
      validationsCount: report.validationsCount,
      contributed: report.contributed,
      valid: report.valid,
      invalidatedAt: report.invalidatedAt,
      createdAtBlockNumber: report.createdAtBlockNumber,
    };
  };

  const generateResearchObject = (research) => {
    return {
      id: research.id,
      era: research.era,
      createdBy: research.createdBy,
      title: research.title,
      thesis: research.thesis,
      file: research.file,
      validationsCount: research.validationsCount,
      valid: research.valid,
      invalidatedAt: research.invalidatedAt,
      createdAtBlock: research.createdAtBlock,
    };
  };

  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  beforeEach(async () => {
    [
      owner,
      regenerator1Address,
      regenerator2Address,
      inspector1Address,
      inspector2Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
      validator5Address,
      validator6Address,
      validator7Address,
      validator8Address,
      validator9Address,
      validator10Address,
      validator11Address,
      validator12Address,
      validator13Address,
      validator14Address,
      validator15Address,
      contributor1Address,
      contributor2Address,
      dev1Address,
      dev2Address,
      otherAddress,
      resea1Address,
      resea2Address,
      activist1Address,
      activist2Address,
      undefinedAddress,
    ] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    communityRules = await communityRulesDeployed();

    const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");
    regeneratorPool = await regeneratorPoolFactory.deploy(
      regenerationCredit.target,
      regeneratorPoolArgs.halving,
      regeneratorPoolArgs.blocksPerEra
    );

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    validatorPool = await validatorPoolFactory.deploy(
      regenerationCredit.target,
      validatorPoolArgs.halving,
      validatorPoolArgs.blocksPerEra
    );

    const regeneratorRulesFactory = await ethers.getContractFactory("RegeneratorRules");
    regeneratorRules = await regeneratorRulesFactory.deploy(communityRules.target, regeneratorPool.target);

    const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
    inspectorPool = await inspectorPoolFactory.deploy(
      regenerationCredit.target,
      inspectorPoolArgs.halving,
      inspectorPoolArgs.blocksPerEra
    );

    developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
    developerPool = await developerPoolFactory.deploy(
      regenerationCredit.target,
      developerPoolParams.halving,
      developerPoolParams.blocksPerEra
    );

    reseacherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await reseacherPoolFactory.deploy(
      regenerationCredit.target,
      researcherPoolParams.halving,
      researcherPoolParams.blocksPerEra
    );

    contributorPoolFactory = await ethers.getContractFactory("ContributorPool");
    contributorPool = await contributorPoolFactory.deploy(
      regenerationCredit.target,
      contributorPoolParams.halving,
      contributorPoolParams.blocksPerEra
    );

    const maxPenalties = 2;
    const inspectorRulesFactory = await ethers.getContractFactory("InspectorRules");
    inspectorRules = await inspectorRulesFactory.deploy(communityRules.target, inspectorPool.target, maxPenalties);

    const validatorRulesFactory = await ethers.getContractFactory("ValidatorRules");
    instance = await validatorRulesFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    const timeBetweenWorks = 10;
    const developerMaxPenalties = 3;
    const developerSecuryBlocksToAnalysis = 10;
    const developerRulesFactory = await ethers.getContractFactory("DeveloperRules");
    developerRules = await developerRulesFactory.deploy(
      communityRules.target,
      developerPool.target,
      instance.target,
      timeBetweenWorks,
      developerMaxPenalties,
      developerSecuryBlocksToAnalysis
    );

    const contributorSecuryBlocksToAnalysis = 10;
    const contributorRulesFactory = await ethers.getContractFactory("ContributorRules");
    contributorRules = await contributorRulesFactory.deploy(
      communityRules.target,
      contributorPool.target,
      timeBetweenWorks,
      contributorSecuryBlocksToAnalysis
    );

    const reseacherMaxPenalties = 3;
    const reseacherTimeBetweenResearches = 10;
    const researcherSecuryBlocksToAnalysis = 10;
    const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
    researcherRules = await researcherRulesFactory.deploy(
      communityRules.target,
      researcherPool.target,
      instance.target,
      reseacherTimeBetweenResearches,
      reseacherMaxPenalties,
      researcherSecuryBlocksToAnalysis
    );

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      regenerationCredit.target,
      activistPoolArgs.halving,
      activistPoolArgs.blocksPerEra
    );

    const activistRulesFactory = await ethers.getContractFactory("ActivistRules");
    activistRules = await activistRulesFactory.deploy(communityRules.target, activistPool.target);

    const validatorRulesDependencies = {
      communityRulesAddress: communityRules.target,
      regeneratorRulesAddress: regeneratorRules.target,
      validatorPoolAddress: validatorPool.target,
      inspectorRulesAddress: inspectorRules.target,
      developerRulesAddress: developerRules.target,
      researcherRulesAddress: researcherRules.target,
      contributorRulesAddress: contributorRules.target,
      activistRulesAddress: activistRules.target,
    };

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(regeneratorRules.target);
    await communityRules.newAllowedCaller(inspectorRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(owner);
    await regeneratorRules.newAllowedCaller(instance.target);
    await regeneratorRules.newAllowedCaller(owner);
    await developerRules.newAllowedCaller(owner);
    await developerRules.newAllowedCaller(instance.target);
    await researcherRules.newAllowedCaller(instance.target);
    await researcherRules.newAllowedCaller(owner);
    await activistRules.newAllowedCaller(instance.target);
    await activistRules.newAllowedCaller(owner);
    await contributorRules.newAllowedCaller(instance.target);
    await regeneratorPool.newAllowedCaller(regeneratorRules.target);
    await regeneratorPool.newAllowedCaller(owner);
    await validatorPool.newAllowedCaller(instance.target);
    await developerPool.newAllowedCaller(developerRules.target);
    await researcherPool.newAllowedCaller(researcherRules.target);
    await contributorPool.newAllowedCaller(contributorRules.target);
    await activistPool.newAllowedCaller(activistRules.target);
    await inspectorPool.newAllowedCaller(inspectorRules.target);
    await inspectorRules.newAllowedCaller(instance.target);
    await inspectorRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await instance.newAllowedCaller(developerRules);

    await instance.setContractAddressDependencies(validatorRulesDependencies);

    await regenerationCredit.addContractPool(validatorPool.target, validatorPoolArgs.totalTokens);
    await regenerationCredit.addContractPool(regeneratorRules.target, regeneratorPoolArgs.totalTokens);

    await addInvitation(owner, validator1Address, userTypes.Validator, owner);
    await addInvitation(owner, inspector1Address, userTypes.Inspector, owner);
  });

  describe("#addValidator", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addValidator(validator2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when validator exists", () => {
        it("should return error", async () => {
          await addValidator(validator1Address);
          await expect(addValidator(validator1Address)).to.be.revertedWith("User already exists");
        });
      });

      context("when validator don't exist", () => {
        it("should create validator", async () => {
          await addValidator(validator1Address);
          const validator = await instance.getValidator(validator1Address);

          expect(validator.validatorWallet).to.equal(validator1Address.address);
        });

        it("should increment validatorCount after create validator", async () => {
          await addValidator(validator1Address);
          const validatorsCount = await communityRules.userTypesCount(userTypes.Validator);

          expect(validatorsCount).to.equal(1);
        });

        it("should add created validator in userType contract as a VALIDATOR", async () => {
          await addValidator(validator1Address);

          const userType = await communityRules.getUser(validator1Address);
          const VALIDATOR = 8;

          expect(userType).to.equal(VALIDATOR);
        });
      });
    });
  });

  describe("#addUserValidation", () => {
    context("when caller is validator", () => {
      context("when user already is denied", () => {
        beforeEach(async () => {
          await addInvitation(owner, validator2Address, userTypes.Validator, owner);
          await addValidator(validator1Address);
          await addValidator(validator2Address);
          await denyUser(validator2Address);
        });

        it("should return error", async () => {
          await expect(
            instance.connect(validator1Address).addUserValidation(validator2Address, "justification")
          ).to.be.revertedWith("User already denied");
        });
      });

      context("when user is not denied", () => {
        context("when user validations count is not equal majorityValidatorsCount", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addInvitation(owner, validator3Address, userTypes.Validator, owner);
            await addInvitation(owner, validator4Address, userTypes.Validator, owner);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addUserValidation(validator2Address, "my justification");
          });

          it("should add validation", async () => {
            const validations = await instance.getUserValidations(validator2Address);

            expect(validations[0].justification).to.equal("my justification");
            expect(validations.length).to.equal(1);
          });

          it("user type must be the same", async () => {
            const user = await communityRules.getUser(validator2Address);
            const VALIDATOR = 8;

            expect(user).to.equal(VALIDATOR);
          });
        });

        context("when user validations count is equal or bigger than majorityValidatorsCount", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addInvitation(owner, validator3Address, userTypes.Validator, owner);
            await addInvitation(owner, validator4Address, userTypes.Validator, owner);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);
          });

          context("when current era is 1", () => {
            context("with regenerator", () => {
              beforeEach(async () => {
                await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
                await addRegenerator("Regenerator A", regenerator1Address);
                await addRegenerator("Regenerator B", regenerator2Address);

                await instance.connect(validator1Address).addUserValidation(regenerator1Address, "my justification");
                receipt = await instance
                  .connect(validator3Address)
                  .addUserValidation(regenerator1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(regenerator1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(regenerator1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levels = await regeneratorPool.eraLevels(1, regenerator1Address);

                expect(levels).to.equal(0);
              });

              it("remove user regenerationScore from regenerator", async () => {
                const regenerator = await regeneratorRules.getRegenerator(regenerator1Address);

                expect(regenerator.regenerationScore.score).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Regenerator);

                expect(userTypesCount).to.equal(1);
              });

              it("regenerationArea should be decremented", async () => {
                const decrementedArea = await regeneratorRules.regenerationArea();

                expect(decrementedArea).to.equal(1000);
              });

              it("must emit DeniedUserEvent", async () => {
                await expect(receipt).to.emit(communityRules, "DeniedUserEvent").withArgs(regenerator1Address);
              });
            });

            context("with inspector", () => {
              beforeEach(async () => {
                await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
                await addInspector("Inspector A", inspector1Address);
                await addInspector("Inspector B", inspector2Address);

                await inspectorRules.afterAcceptInspection(inspector1Address, 1);
                await inspectorRules.afterAcceptInspection(inspector1Address, 1);
                await inspectorRules.afterAcceptInspection(inspector1Address, 1);

                await inspectorRules.afterRealizeInspection(inspector1Address);
                await inspectorRules.afterRealizeInspection(inspector1Address);
                await inspectorRules.afterRealizeInspection(inspector1Address);

                await instance.connect(validator1Address).addUserValidation(inspector1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(inspector1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(inspector1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(inspector1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await inspectorPool.eraLevels(1, inspector1Address);
                const levelsEra2 = await inspectorPool.eraLevels(2, inspector1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("remove user levels from inspector", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.pool.level).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Inspector);

                expect(userTypesCount).to.equal(1);
              });
            });

            context("with contributor", () => {
              beforeEach(async () => {
                await addInvitation(owner, contributor1Address, userTypes.Contributor, owner);
                await addInvitation(owner, contributor2Address, userTypes.Contributor, owner);
                await addContributor("Contributor  A", contributor1Address);
                await addContributor("Contributor  B", contributor2Address);

                await contributorRules.connect(contributor1Address).addContribution("description", "contribution");

                await instance.connect(validator1Address).addUserValidation(contributor1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(contributor1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(contributor1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(contributor1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await contributorPool.eraLevels(1, contributor1Address);
                const levelsEra2 = await contributorPool.eraLevels(2, contributor1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("do not remove user levels from contributor", async () => {
                const contributor = await contributorRules.getContributor(contributor1Address);

                expect(contributor.pool.level).to.equal(1);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Contributor);

                expect(userTypesCount).to.equal(1);
              });
            });

            context("with developer", () => {
              beforeEach(async () => {
                await addInvitation(owner, dev1Address, userTypes.Developer, owner);
                await addInvitation(owner, dev2Address, userTypes.Developer, owner);
                await addDeveloper("Developer  A", dev1Address);
                await addDeveloper("Developer  A", dev2Address);

                await developerRules.connect(dev1Address).addReport("description", "report");

                await instance.connect(validator1Address).addUserValidation(dev1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(dev1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(dev1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(dev1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await developerPool.eraLevels(1, dev1Address);
                const levelsEra2 = await developerPool.eraLevels(2, dev1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("remove user levels from developer", async () => {
                const developer = await developerRules.getDeveloper(dev1Address);

                expect(developer.pool.level).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Developer);

                expect(userTypesCount).to.equal(1);
              });
            });

            context("with researcher", () => {
              beforeEach(async () => {
                await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
                await addInvitation(owner, resea2Address, userTypes.Researcher, owner);
                await addResearcher("Researcher  A", resea1Address);
                await addResearcher("Researcher  B", resea2Address);

                await addResearch(resea1Address);

                await instance.connect(validator1Address).addUserValidation(resea1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(resea1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(resea1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(resea1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await researcherPool.eraLevels(1, resea1Address);
                const levelsEra2 = await researcherPool.eraLevels(2, resea1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("remove user levels from researcher", async () => {
                const reseacher = await researcherRules.getResearcher(resea1Address);

                expect(reseacher.pool.level).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Researcher);

                expect(userTypesCount).to.equal(1);
              });
            });

            context("with activist", () => {
              beforeEach(async () => {
                await addInvitation(owner, activist1Address, userTypes.Activist, owner);
                await addInvitation(owner, activist2Address, userTypes.Activist, owner);
                await addActivist("Activist  A", activist1Address);
                await addActivist("Activist  B", activist2Address);

                await addInvitation(activist1Address, inspector2Address, userTypes.Inspector, owner);

                await activistRules.addLevel(regenerator1Address, 0, inspector2Address, 3);

                await instance.connect(validator1Address).addUserValidation(activist1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(activist1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(activist1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(activist1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await activistPool.eraLevels(1, activist1Address);
                const levelsEra2 = await activistPool.eraLevels(2, activist1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("remove user levels from activist", async () => {
                const activist = await activistRules.getActivist(activist1Address);

                expect(activist.pool.level).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Activist);

                expect(userTypesCount).to.equal(1);
              });
            });

            context("with validator", () => {
              beforeEach(async () => {
                await instance.connect(validator1Address).declareAlive();

                await instance.connect(validator1Address).addUserValidation(validator1Address, "my justification");
                await instance.connect(validator3Address).addUserValidation(validator1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(validator1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(validator1Address);
                const DENIED = 9;

                expect(user).to.equal(DENIED);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await validatorPool.eraLevels(1, validator1Address);
                const levelsEra2 = await validatorPool.eraLevels(2, validator1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("remove user levels from validator", async () => {
                const validator = await instance.getValidator(validator1Address);

                expect(validator.pool.level).to.equal(0);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Validator);

                expect(userTypesCount).to.equal(3);
              });
            });
          });

          context("when current era is 2", () => {
            context("when validators have contributed to last era", () => {
              beforeEach(async () => {
                await instance.connect(validator1Address).declareAlive();
                await instance.connect(validator2Address).declareAlive();
                await instance.connect(validator3Address).declareAlive();
                await instance.connect(validator4Address).declareAlive();

                await advanceBlock(validatorPoolArgs.blocksPerEra);
              });

              context("when add validation", () => {
                beforeEach(async () => {
                  await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                  await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
                  await addRegenerator("Regenerator A", regenerator1Address);
                  await addRegenerator("Regenerator B", regenerator2Address);

                  await instance.connect(validator1Address).addUserValidation(regenerator1Address, "my justification");
                  receipt = await instance
                    .connect(validator3Address)
                    .addUserValidation(regenerator1Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(regenerator1Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(2);
                });
              });
            });

            context("when validator does not have contributed to last era", () => {
              beforeEach(async () => {
                await instance.connect(validator2Address).declareAlive();
                await instance.connect(validator3Address).declareAlive();
                await instance.connect(validator4Address).declareAlive();

                await advanceBlock(validatorPoolArgs.blocksPerEra);
              });

              context("when add validation", () => {
                beforeEach(async () => {
                  await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                  await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
                  await addRegenerator("Regenerator A", regenerator1Address);
                  await addRegenerator("Regenerator B", regenerator2Address);
                });

                it("should return error", async () => {
                  await expect(
                    instance.connect(validator1Address).addUserValidation(regenerator1Address, "my justification")
                  ).to.be.revertedWith("You did not contribute in the last era");
                });
              });
            });
          });
        });
      });
    });

    context("when caller is not validator", () => {
      it("should return error", async () => {
        await expect(
          instance.connect(otherAddress).addUserValidation(validator5Address, "justification")
        ).to.be.revertedWith("User must be a validator");
      });
    });

    context("when validator already voted to inspection", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await instance.connect(validator1Address).addUserValidation(validator4Address, "justification");
      });

      it("should return error", async () => {
        await expect(
          instance.connect(validator1Address).addUserValidation(validator4Address, "justification")
        ).to.be.revertedWith("Already voted");
      });
    });

    context("when is not a registered user", () => {
      it("should return error", async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addValidator(validator1Address);

        await expect(
          instance.connect(validator1Address).addUserValidation(undefinedAddress, "justification")
        ).to.be.revertedWith("User not registered");
      });
    });
  });

  describe("#addInspectionValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
      });

      context("when validator already voted to inspection", () => {
        beforeEach(async () => {
          inspectionMock = {
            id: 1,
            status: 3,
            regenerator: regenerator1Address,
            inspector: inspector1Address,
            regenerationScore: 10,
            proofPhoto: "",
            report: "",
            validationsCount: 0,
            createdAt: 100,
            acceptedAt: 100,
            inspectedAt: 100,
            inspectedAtEra: 10,
            invalidatedAt: 0,
          };

          await instance.connect(owner).addInspectionValidation(inspectionMock, "justification", validator1Address);
        });

        it("should return error", async () => {
          await expect(
            instance.connect(owner).addInspectionValidation(inspectionMock, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to inspection", () => {
        context("when current era is 1", () => {
          context("when inspection validations is => majorityValidatorsCount (addPenalty == true)", () => {
            context("when inspector total penalties is >= inspectorRules.maxPenalties", () => {
              beforeEach(async () => {
                inspectionMock = {
                  id: 1,
                  status: 3,
                  regenerator: regenerator1Address,
                  inspector: inspector1Address,
                  regenerationScore: 20,
                  proofPhoto: "",
                  report: "",
                  validationsCount: 2,
                  createdAt: 100,
                  acceptedAt: 100,
                  inspectedAt: 100,
                  inspectedAtEra: 10,
                  invalidatedAt: 0,
                };

                await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);

                await addRegenerator("Regenerator A", regenerator1Address);
                await addInspector("Inspector A", inspector1Address);

                await inspectorRules.afterAcceptInspection(inspectionMock.inspector, 1);
                await inspectorRules.afterAcceptInspection(inspectionMock.inspector, 1);

                await inspectorRules.afterRealizeInspection(inspectionMock.inspector);
                await inspectorRules.afterRealizeInspection(inspectionMock.inspector);

                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 10);
                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 10);
                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 30);

                await inspectorRules.addPenalty(inspectionMock.inspector, 2);
                await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
              });

              it("deny inspector", async () => {
                const newInspectorType = await communityRules.getUser(inspectionMock.inspector);

                expect(newInspectorType).to.equal(9);
              });

              it("all inspector contract levels is removed", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.pool.level).to.equal(0);
              });

              it("decrement total inspections of inspector", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.totalInspections).to.equal(1);
              });

              it("decrement total inspections of regenerator", async () => {
                const regenerator = await regeneratorRules.getRegenerator(regenerator1Address);

                expect(regenerator.totalInspections).to.equal(2);
              });

              it("remove inspection regeneration score level from regenerator regenerationScore", async () => {
                const regenerator = await regeneratorRules.getRegenerator(regenerator1Address);

                expect(regenerator.regenerationScore.score).to.equal(30);
              });

              it("remove inspection regeneration score level from regenerator pool", async () => {
                const levels = await regeneratorPool.eraLevels(3, regenerator1Address);

                expect(levels).to.equal(0);
              });
            });

            context("when inspectorTotal penalties is < inspectorRules.maxPenalties", () => {
              beforeEach(async () => {
                inspectionMock = {
                  id: 1,
                  status: 3,
                  regenerator: regenerator1Address,
                  inspector: inspector1Address,
                  regenerationScore: 20,
                  proofPhoto: "",
                  report: "",
                  validationsCount: 2,
                  createdAt: 100,
                  acceptedAt: 100,
                  inspectedAt: 100,
                  inspectedAtEra: 10,
                  invalidatedAt: 0,
                };

                await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);

                await addRegenerator("Regenerator A", regenerator1Address);
                await addInspector("Inspector A", inspector1Address);

                await inspectorRules.afterAcceptInspection(inspectionMock.inspector, 1);
                await inspectorRules.afterAcceptInspection(inspectionMock.inspector, 1);

                await inspectorRules.afterRealizeInspection(inspectionMock.inspector);
                await inspectorRules.afterRealizeInspection(inspectionMock.inspector);

                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 10);
                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 10);
                await regeneratorRules.afterRealizeInspection(inspectionMock.regenerator, 30);

                await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
              });

              it("inspector is the same", async () => {
                const newInspectorType = await communityRules.getUser(inspectionMock.inspector);

                expect(newInspectorType).to.equal(2);
              });

              it("inspector contract levels is removed", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.pool.level).to.equal(1);
              });

              it("decrement total inspections of inspector", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.totalInspections).to.equal(1);
              });

              it("decrement total inspections of regenerator", async () => {
                const regenerator = await regeneratorRules.getRegenerator(regenerator1Address);

                expect(regenerator.totalInspections).to.equal(2);
              });

              it("remove inspection regeneration score level from regenerator regenerationScore", async () => {
                const regenerator = await regeneratorRules.getRegenerator(regenerator1Address);

                expect(regenerator.regenerationScore.score).to.equal(30);
              });

              it("remove inspection regeneration score level from regenerator pool", async () => {
                const levels = await regeneratorPool.eraLevels(3, regenerator1Address);

                expect(levels).to.equal(0);
              });
            });
          });

          context("when inspection validations is < majorityValidatorsCount (addPenalty == false)", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                regenerator: regenerator1Address,
                inspector: inspector1Address,
                regenerationScore: 20,
                proofPhoto: "",
                report: "",
                validationsCount: 1,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.inspectionValidations(1, 0);

              expect(validation[0]).to.equal(validator1Address.address);
              expect(validation[1]).to.equal(1);
              expect(validation[2]).to.equal("foo");
              expect(validation[3]).to.equal(2);
            });
          });
        });

        context("when current era is 2", () => {
          context("when validators have contributed to last era", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                regenerator: regenerator1Address,
                inspector: inspector1Address,
                regenerationScore: 20,
                proofPhoto: "",
                report: "",
                validationsCount: 1,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await instance.connect(validator1Address).declareAlive();
              await instance.connect(validator2Address).declareAlive();
              await instance.connect(validator3Address).declareAlive();
              await instance.connect(validator4Address).declareAlive();

              await advanceBlock(validatorPoolArgs.blocksPerEra);

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.inspectionValidations(1, 0);

              expect(validation[0]).to.equal(validator1Address.address);
              expect(validation[1]).to.equal(1);
              expect(validation[2]).to.equal("foo");
              expect(validation[3]).to.equal(2);
            });
          });

          context("when validator does not have contributed to last era", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                regenerator: regenerator1Address,
                inspector: inspector1Address,
                regenerationScore: 20,
                proofPhoto: "",
                report: "",
                validationsCount: 0,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await advanceBlock(validatorPoolArgs.blocksPerEra);
            });

            it("should return error", async () => {
              await expect(
                instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address)
              ).to.be.revertedWith("You did not contribute in the last era");
            });
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        inspectionMock = {
          id: 1,
          status: 3,
          regenerator: regenerator1Address,
          inspector: inspector1Address,
          regenerationScore: 20,
          proofPhoto: "",
          report: "",
          validationsCount: 0,
          createdAt: 100,
          acceptedAt: 100,
          inspectedAt: 100,
          inspectedAtEra: 10,
          invalidatedAt: 0,
        };

        await expect(
          instance.connect(dev1Address).addInspectionValidation(inspectionMock, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addDeveloperReportValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, dev1Address, userTypes.Developer, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addDeveloper("Developer A", dev1Address);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);

        await developerRules.connect(dev1Address).addReport("description", "report");
      });

      context("when validator already voted to report", () => {
        beforeEach(async () => {
          let report = await developerRules.getReport(1);
          report = generateReportObject(report);

          await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator1Address);
        });

        it("should return error", async () => {
          let report = await developerRules.getReport(1);
          report = generateReportObject(report);

          await expect(
            instance.connect(owner).addDeveloperReportValidation(report, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to report", () => {
        context("when current era is 1", () => {
          context("when report validations is => majorityValidatorsCount (addPenalty == true)", () => {
            context("when developer total penalties is >= developerRules.maxPenalties", () => {
              beforeEach(async () => {
                let report = await developerRules.getReport(1);
                report = generateReportObject(report);
                report.validationsCount = 1;

                await developerRules.addPenalty(dev1Address, report.id);
                await developerRules.addPenalty(dev1Address, report.id);

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator1Address);

                report.validationsCount = 2;
                await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator2Address);
              });

              it("should add research validation", async () => {
                const validation = await instance.reportValidations(1, 0);

                expect(validation[0]).to.equal(validator1Address.address);
                expect(validation[1]).to.equal(1);
                expect(validation[2]).to.equal("justification");
                expect(validation[3]).to.equal(2);
              });

              it("deny developer", async () => {
                const newDeveloperType = await communityRules.getUser(dev1Address);

                expect(newDeveloperType).to.equal(9);
              });

              it("remove report regeneration score level from developer pool", async () => {
                const levels = await developerPool.eraLevels(4, dev1Address);

                expect(levels).to.equal(0);
              });
            });

            context("when developer total penalties is < developerRules.maxPenalties", () => {
              beforeEach(async () => {
                let report = await developerRules.getReport(1);
                report = generateReportObject(report);
                report.validationsCount = 1;

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator1Address);

                report = await developerRules.getReport(1);
                report = generateReportObject(report);
                report.validationsCount = 2;

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator2Address);
              });

              it("developer is the same", async () => {
                const newDeveloperType = await communityRules.getUser(dev1Address);

                expect(newDeveloperType).to.equal(4);
              });

              it("remove report regeneration score level from developer pool", async () => {
                const levels = await developerPool.eraLevels(2, dev1Address);

                expect(levels).to.equal(0);
              });
            });
          });

          context("when report validations is < majorityValidatorsCount (addPenalty == false)", () => {
            beforeEach(async () => {
              let report = await developerRules.getReport(1);
              report = generateReportObject(report);
              report.validationsCount = 1;

              await instance.connect(owner).addDeveloperReportValidation(report, "justification", validator1Address);
            });

            it("total penalties is zero", async () => {
              const totalPenalties = await developerRules.totalPenalties(dev1Address);

              expect(totalPenalties).to.equal(0);
            });
          });
        });

        context("when current era is 2", () => {
          context("when validators have contributed to last era", () => {
            beforeEach(async () => {
              let report = await developerRules.getReport(1);
              report = generateReportObject(report);

              await instance.connect(validator1Address).declareAlive();
              await instance.connect(validator2Address).declareAlive();
              await instance.connect(validator3Address).declareAlive();
              await instance.connect(validator4Address).declareAlive();

              await advanceBlock(validatorPoolArgs.blocksPerEra);

              report.validationsCount = 1;
              await instance.connect(owner).addDeveloperReportValidation(report, "foo", validator1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.reportValidations(1, 0);

              expect(validation[0]).to.equal(validator1Address.address);
              expect(validation[1]).to.equal(1);
              expect(validation[2]).to.equal("foo");
              expect(validation[3]).to.equal(2);
            });
          });

          context("when validator does not have contributed to last era", () => {
            beforeEach(async () => {
              report = await developerRules.getReport(1);
              report = generateReportObject(report);

              await advanceBlock(validatorPoolArgs.blocksPerEra);
            });

            it("should return error", async () => {
              await expect(
                instance.connect(owner).addDeveloperReportValidation(report, "foo", validator1Address)
              ).to.be.revertedWith("You did not contribute in the last era");
            });
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        let report = await developerRules.getReport(1);
        report = generateReportObject(report);

        await expect(
          instance.connect(validator1Address).addDeveloperReportValidation(report, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addResearcherResearchValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addResearcher("Researcher A", resea1Address);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);

        await addResearch(resea1Address);
      });

      context("when validator already voted to research", () => {
        beforeEach(async () => {
          let research = await researcherRules.researches(1);
          research = generateResearchObject(research);

          await instance.connect(owner).addResearcherResearchValidation(research, "justification", validator1Address);
        });

        it("should add research validation", async () => {
          const validation = await instance.researchValidations(1, 0);

          expect(validation[0]).to.equal(validator1Address.address);
          expect(validation[1]).to.equal(1);
          expect(validation[2]).to.equal("justification");
          expect(validation[3]).to.equal(2);
        });

        it("should return error", async () => {
          let research = await researcherRules.researches(1);
          research = generateResearchObject(research);

          await expect(
            instance.connect(owner).addResearcherResearchValidation(research, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to research", () => {
        context("when current era is 1", () => {
          context("when research validations is => majorityValidatorsCount (addPenalty == true)", () => {
            context("when researcher total penalties is >= researcherRules.maxPenalties", () => {
              beforeEach(async () => {
                let research = await researcherRules.researches(1);
                research = generateResearchObject(research);
                research.validationsCount = 1;

                await researcherRules.addPenalty(research.createdBy, research.id);
                await researcherRules.addPenalty(research.createdBy, research.id);

                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", validator1Address);

                research.validationsCount = 2;
                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", validator2Address);
              });

              it("deny researcher", async () => {
                const newResearcherType = await communityRules.getUser(resea1Address);

                expect(newResearcherType).to.equal(9);
              });

              it("remove research regeneration score level from researcher pool", async () => {
                const levels = await researcherPool.eraLevels(4, resea1Address);

                expect(levels).to.equal(0);
              });
            });

            context("when researcher total penalties is < researcherRules.maxPenalties", () => {
              beforeEach(async () => {
                let research = await researcherRules.researches(1);
                research = generateResearchObject(research);
                research.validationsCount = 1;

                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", validator1Address);

                research = await researcherRules.researches(1);
                research = generateResearchObject(research);
                research.validationsCount = 2;

                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", validator2Address);
              });

              it("researcher is the same", async () => {
                const userType = await communityRules.getUser(resea1Address);

                expect(userType).to.equal(3);
              });

              it("remove report regeneration score level from researcher pool", async () => {
                let research = await researcherRules.researches(1);
                const levels = await researcherPool.eraLevels(research.era, resea1Address);

                expect(levels).to.equal(0);
              });
            });
          });

          context("when research validations is < majorityValidatorsCount (addPenalty == false)", () => {
            beforeEach(async () => {
              let research = await researcherRules.researches(1);
              research = generateResearchObject(research);
              research.validationsCount = 1;

              await instance
                .connect(owner)
                .addResearcherResearchValidation(research, "justification", validator1Address);
            });

            it("total penalties is zero", async () => {
              const totalPenalties = await researcherRules.totalPenalties(resea1Address);

              expect(totalPenalties).to.equal(0);
            });
          });
        });

        context("when current era is 2", () => {
          context("when validators have contributed to last era", () => {
            beforeEach(async () => {
              let research = await researcherRules.researches(1);
              research = generateResearchObject(research);
              research.validationsCount = 1;

              await instance.connect(validator1Address).declareAlive();
              await instance.connect(validator2Address).declareAlive();
              await instance.connect(validator3Address).declareAlive();
              await instance.connect(validator4Address).declareAlive();

              await advanceBlock(validatorPoolArgs.blocksPerEra);

              research.validationsCount = 1;
              await instance.connect(owner).addResearcherResearchValidation(research, "foo", validator1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.researchValidations(1, 0);

              expect(validation[0]).to.equal(validator1Address.address);
              expect(validation[1]).to.equal(1);
              expect(validation[2]).to.equal("foo");
              expect(validation[3]).to.equal(2);
            });
          });

          context("when validator does not have contributed to last era", () => {
            beforeEach(async () => {
              research = await researcherRules.researches(1);
              research = generateResearchObject(research);

              await advanceBlock(validatorPoolArgs.blocksPerEra);
            });

            it("should return error", async () => {
              await expect(
                instance.connect(owner).addResearcherResearchValidation(research, "justification", validator1Address)
              ).to.be.revertedWith("You did not contribute in the last era");
            });
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        let research = await researcherRules.researches(1);
        research = generateResearchObject(research);

        await expect(
          instance
            .connect(validator1Address)
            .addResearcherResearchValidation(research, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#getValidator", () => {
    context("when validator exists", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should return a validator", async () => {
        const validator = await instance.getValidator(validator1Address);

        expect(validator.validatorWallet).to.equal(validator1Address.address);
      });
    });

    context("when validator don't exists", () => {
      it("should return a validator", async () => {
        const validator = await instance.getValidator(validator2Address);

        expect(validator.validatorWallet).to.equal("0x0000000000000000000000000000000000000000");
      });
    });
  });

  describe("#majorityValidatorsCount", () => {
    context("when current era is 1", () => {
      context("when have 8 validators", () => {
        beforeEach(async () => {
          await addInvitation(owner, validator2Address, userTypes.Validator, owner);
          await addInvitation(owner, validator3Address, userTypes.Validator, owner);
          await addInvitation(owner, validator4Address, userTypes.Validator, owner);
          await addInvitation(owner, validator5Address, userTypes.Validator, owner);
          await addInvitation(owner, validator6Address, userTypes.Validator, owner);
          await addInvitation(owner, validator7Address, userTypes.Validator, owner);
          await addInvitation(owner, validator8Address, userTypes.Validator, owner);

          await addValidator(validator1Address);
          await addValidator(validator2Address);
          await addValidator(validator3Address);
          await addValidator(validator4Address);
          await addValidator(validator5Address);
          await addValidator(validator6Address);
          await addValidator(validator7Address);
          await addValidator(validator8Address);
        });

        it("returns 4", async () => {
          const majorityValidatorsCount = await instance.majorityValidatorsCount();

          expect(majorityValidatorsCount).to.equal(4);
        });
      });
    });

    context("when current era is 2", () => {
      context("when have 8 validators", () => {
        beforeEach(async () => {
          await addInvitation(owner, validator2Address, userTypes.Validator, owner);
          await addInvitation(owner, validator3Address, userTypes.Validator, owner);
          await addInvitation(owner, validator4Address, userTypes.Validator, owner);
          await addInvitation(owner, validator5Address, userTypes.Validator, owner);
          await addInvitation(owner, validator6Address, userTypes.Validator, owner);
          await addInvitation(owner, validator7Address, userTypes.Validator, owner);
          await addInvitation(owner, validator8Address, userTypes.Validator, owner);

          await addValidator(validator1Address);
          await addValidator(validator2Address);
          await addValidator(validator3Address);
          await addValidator(validator4Address);
          await addValidator(validator5Address);
          await addValidator(validator6Address);
          await addValidator(validator7Address);
          await addValidator(validator8Address);
        });

        context("when 4 validators have contributed in era 1", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).declareAlive();
            await instance.connect(validator2Address).declareAlive();
            await instance.connect(validator3Address).declareAlive();
            await instance.connect(validator4Address).declareAlive();

            await advanceBlock(validatorPoolArgs.blocksPerEra);
          });

          it("returns 2", async () => {
            const majorityValidatorsCount = await instance.majorityValidatorsCount();

            expect(majorityValidatorsCount).to.equal(2);
          });
        });

        context("when no validators have contributed in era 1", () => {
          beforeEach(async () => {
            await advanceBlock(validatorPoolArgs.blocksPerEra);
          });

          it("returns 0", async () => {
            const majorityValidatorsCount = await instance.majorityValidatorsCount();

            expect(majorityValidatorsCount).to.equal(0);
          });
        });
      });
    });
  });

  describe("#declareAlive", () => {
    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(regenerator1Address).declareAlive()).to.be.revertedWith(
          "User must be a validator"
        );
      });
    });

    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should add 1 level", async () => {
        await instance.connect(validator1Address).declareAlive();

        const validator = await instance.getValidator(validator1Address);

        expect(validator.pool.level).to.equal(1);
      });

      context("when adding report to eras", () => {
        beforeEach(async () => {
          await instance.connect(validator1Address).declareAlive();

          await advanceBlock(validatorPoolArgs.blocksPerEra);

          await instance.connect(validator1Address).declareAlive();
        });

        it("eras 1 must have 1 level", async () => {
          const eraLevels = await validatorPool.eraLevels(1, validator1Address);

          expect(eraLevels).to.equal(1);
        });

        it("eras 2 must have 1 level", async () => {
          const eraLevels = await validatorPool.eraLevels(2, validator1Address);

          expect(eraLevels).to.equal(1);
        });
      });
    });

    context("when is a validator and has already added a level in that era", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).declareAlive();
      });

      it("should return error", async () => {
        await expect(instance.connect(validator1Address).declareAlive()).to.be.revertedWith("Only once per era");
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).declareAlive();
      });

      context("when validator is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await expect(instance.connect(validator1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });

      context("when validator is in era 1 and current era is 2", () => {
        context("with one validator", () => {
          beforeEach(async () => {
            await advanceBlock(validatorPoolArgs.blocksPerEra);
            await instance.connect(validator1Address).withdraw();
          });

          it("withdraw 1250000000000000000000000 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(validator1Address);
            const expectedBalance = 1250000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });

        context("with two validators", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addValidator(validator2Address);
            await instance.connect(validator2Address).declareAlive();

            await advanceBlock(validatorPoolArgs.blocksPerEra);

            await instance.connect(validator1Address).withdraw();
          });

          it("withdraw 625000000000000000000000 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(validator1Address);
            const expectedBalance = 625000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(regenerator1Address).withdraw()).to.be.revertedWith("Pool only to validators");
      });
    });
  });
});
