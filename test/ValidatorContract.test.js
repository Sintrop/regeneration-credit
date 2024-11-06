const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { userContractDeployed } = require("./shared/user_contract_deployed");

describe("ValidatorContract", () => {
  let instance;
  let userContract;
  let producerContract;
  let producerPool;
  let validatorPool;
  let inspectorPool;
  let researcherPool;
  let activistPool;
  let activistContract;
  let inspectorContract;
  let developerContract;
  let researcherContract;
  let contributorContract;
  let regenerationCredit;

  let owner,
    producer1Address,
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
    dev1Address,
    otherAddress,
    resea1Address,
    activist1Address;

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const validatorPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 36,
  };

  const inspectorPoolArgs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  let developerPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 36,
  };

  let researcherPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 30,
  };

  let contributorPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 30,
  };

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  const addDeveloper = async (name, from) => {
    await developerContract.connect(from).addDeveloper(name, "photoURL");
  };

  const addResearcher = async (name, from) => {
    await researcherContract.connect(from).addResearcher(name, "photoURL");
  };

  const addContributor = async (name, from) => {
    await contributorContract.connect(from).addContributor(name, "photoURL");
  };

  const addValidator = async (from) => {
    await instance.connect(from).addValidator();
  };

  const addActivist = async (name, from) => {
    await activistContract.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addProducer = async (name, from) => {
    await producerContract.connect(from).addProducer(10, name, "photoURL", "135465-005");
  };

  const addInspector = async (name, from) => {
    await inspectorContract.connect(from).addInspector(name, "photoURL");
  };

  const addWork = async (from) => {
    await researcherContract.connect(from).addWork("title", "thesis", "fileURL");
  };

  const denyUser = async (userAddress) => {
    await userContract.setDeniedType(userAddress);
  };

  const generateContributionObject = (contribution) => {
    return {
      id: contribution.id,
      era: contribution.era,
      developer: contribution.developer,
      level: contribution.level,
      report: contribution.report,
      validationsCount: contribution.validationsCount,
      contributed: contribution.contributed,
      valid: contribution.valid,
      invalidatedAt: contribution.invalidatedAt,
      createdAtBlockNumber: contribution.createdAtBlockNumber,
    };
  };

  const generateWorkObject = (work) => {
    return {
      id: work.id,
      era: work.era,
      createdBy: work.createdBy,
      title: work.title,
      thesis: work.thesis,
      file: work.file,
      validationsCount: work.validationsCount,
      valid: work.valid,
      invalidatedAt: work.invalidatedAt,
      createdAtBlock: work.createdAtBlock,
    };
  };

  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  beforeEach(async () => {
    [
      owner,
      producer1Address,
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
      dev1Address,
      dev2Address,
      resea1Address,
      activist1Address,
      undefinedAddress,
    ] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    userContract = await userContractDeployed();

    const producerPoolFactory = await ethers.getContractFactory("ProducerPool");
    producerPool = await producerPoolFactory.deploy(
      regenerationCredit.target,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    validatorPool = await validatorPoolFactory.deploy(
      regenerationCredit.target,
      validatorPoolArgs.halving,
      validatorPoolArgs.totalEras,
      validatorPoolArgs.blocksPerEra
    );

    const producerContractFactory = await ethers.getContractFactory("ProducerContract");
    producerContract = await producerContractFactory.deploy(userContract.target, producerPool.target);

    const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
    inspectorPool = await inspectorPoolFactory.deploy(
      regenerationCredit.target,
      inspectorPoolArgs.halving,
      inspectorPoolArgs.totalEras,
      inspectorPoolArgs.blocksPerEra
    );

    developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
    developerPool = await developerPoolFactory.deploy(
      regenerationCredit.target,
      developerPoolParams.halving,
      developerPoolParams.totalEras,
      developerPoolParams.blocksPerEra
    );

    reseacherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await reseacherPoolFactory.deploy(
      regenerationCredit.target,
      researcherPoolParams.halving,
      researcherPoolParams.totalEras,
      researcherPoolParams.blocksPerEra
    );

    contributorPoolFactory = await ethers.getContractFactory("ContributorPool");
    contributorPool = await contributorPoolFactory.deploy(
      regenerationCredit.target,
      contributorPoolParams.halving,
      contributorPoolParams.totalEras,
      contributorPoolParams.blocksPerEra
    );

    const maxPenalties = 2;
    const inspectorContractFactory = await ethers.getContractFactory("InspectorContract");
    inspectorContract = await inspectorContractFactory.deploy(userContract.target, inspectorPool.target, maxPenalties);

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    instance = await validatorContractFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    const developerMaxPenalties = 3;
    developerContractFactory = await ethers.getContractFactory("DeveloperContract");
    developerContract = await developerContractFactory.deploy(
      userContract.target,
      developerPool.target,
      instance.target,
      developerMaxPenalties
    );

    contributorContractFactory = await ethers.getContractFactory("ContributorContract");
    contributorContract = await contributorContractFactory.deploy(userContract.target, contributorPool.target);

    const reseacherMaxPenalties = 3;
    const reseacherTimeBetweenWorks = 10;
    researcherContractFactory = await ethers.getContractFactory("ResearcherContract");
    researcherContract = await researcherContractFactory.deploy(
      userContract.target,
      researcherPool.target,
      instance.target,
      reseacherTimeBetweenWorks,
      reseacherMaxPenalties
    );

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      regenerationCredit.target,
      activistPoolArgs.halving,
      activistPoolArgs.totalEras,
      activistPoolArgs.blocksPerEra
    );

    const activistContractFactory = await ethers.getContractFactory("ActivistContract");
    activistContract = await activistContractFactory.deploy(userContract.target, activistPool.target);

    const validatorContractDependencies = {
      userContractAddress: userContract.target,
      producerContractAddress: producerContract.target,
      validatorPoolAddress: validatorPool.target,
      inspectorContractAddress: inspectorContract.target,
      developerContractAddress: developerContract.target,
      researcherContractAddress: researcherContract.target,
      contributorContractAddress: contributorContract.target,
      activistContractAddress: activistContract.target,
    };

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(producerContract.target);
    await userContract.newAllowedCaller(inspectorContract.target);
    await userContract.newAllowedCaller(developerContract.target);
    await userContract.newAllowedCaller(researcherContract.target);
    await userContract.newAllowedCaller(contributorContract.target);
    await userContract.newAllowedCaller(activistContract.target);
    await userContract.newAllowedCaller(owner);
    await producerContract.newAllowedCaller(instance.target);
    await producerContract.newAllowedCaller(owner);
    await developerContract.newAllowedCaller(owner);
    await developerContract.newAllowedCaller(instance.target);
    await researcherContract.newAllowedCaller(instance.target);
    await activistContract.newAllowedCaller(instance.target);
    await activistContract.newAllowedCaller(owner);
    await contributorContract.newAllowedCaller(instance.target);
    await producerPool.newAllowedCaller(producerContract.target);
    await producerPool.newAllowedCaller(owner);
    await validatorPool.newAllowedCaller(instance.target);
    await developerPool.newAllowedCaller(developerContract.target);
    await researcherPool.newAllowedCaller(researcherContract.target);
    await contributorPool.newAllowedCaller(contributorContract.target);
    await activistPool.newAllowedCaller(activistContract.target);
    await inspectorPool.newAllowedCaller(inspectorContract.target);
    await inspectorContract.newAllowedCaller(instance.target);
    await inspectorContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await instance.newAllowedCaller(developerContract);

    await instance.setContractAddressDependencies(validatorContractDependencies);

    await regenerationCredit.addContractPool(validatorPool.target, validatorPoolArgs.totalTokens);
    await regenerationCredit.addContractPool(producerContract.target, producerPoolArgs.totalTokens);

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
          const validatorsCount = await userContract.userTypesCount(userTypes.Validator);

          expect(validatorsCount).to.equal(1);
        });

        it("should add created validator in validatorList (array)", async () => {
          await addValidator(validator1Address);

          const validators = await instance.getValidators();

          expect(validators[0].validatorWallet).to.equal(validator1Address.address);
        });

        it("should add created validator in userType contract as a VALIDATOR", async () => {
          await addValidator(validator1Address);

          const userType = await userContract.getUser(validator1Address);
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
          expect(
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
            const user = await userContract.getUser(validator2Address);
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

          context("with producer", () => {
            beforeEach(async () => {
              await addInvitation(owner, producer1Address, userTypes.Producer, owner);
              await addProducer("Producer A", producer1Address);

              await instance.connect(validator1Address).addUserValidation(producer1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(producer1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(producer1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(producer1Address);
              const DENIED = 9;

              expect(user).to.equal(DENIED);
            });

            it("remove user levels from pool", async () => {
              const levels = await producerPool.eraLevels(1, producer1Address);

              expect(levels).to.equal(0);
            });

            it("remove user isaScore from producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(0);
            });
          });

          context("with inspector", () => {
            beforeEach(async () => {
              await addInspector("Inspector A", inspector1Address);

              await inspectorContract.afterAcceptInspection(inspector1Address, 1);
              await inspectorContract.afterAcceptInspection(inspector1Address, 1);
              await inspectorContract.afterAcceptInspection(inspector1Address, 1);

              await inspectorContract.afterRealizeInspection(inspector1Address);
              await inspectorContract.afterRealizeInspection(inspector1Address);
              await inspectorContract.afterRealizeInspection(inspector1Address);

              await instance.connect(validator1Address).addUserValidation(inspector1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(inspector1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(inspector1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(inspector1Address);
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
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.pool.level).to.equal(0);
            });
          });

          context("with contributor", () => {
            beforeEach(async () => {
              await addInvitation(owner, contributor1Address, userTypes.Contributor, owner);
              await addContributor("Contributor  A", contributor1Address);

              await contributorContract.connect(contributor1Address).addContribution("report");

              await instance.connect(validator1Address).addUserValidation(contributor1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(contributor1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(contributor1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(contributor1Address);
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
              const contributor = await contributorContract.getContributor(contributor1Address);

              expect(contributor.pool.level).to.equal(1);
            });
          });

          context("with developer", () => {
            beforeEach(async () => {
              await addInvitation(owner, dev1Address, userTypes.Developer, owner);
              await addDeveloper("Developer  A", dev1Address);

              await developerContract.connect(dev1Address).addContribution("contribution");

              await instance.connect(validator1Address).addUserValidation(dev1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(dev1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(dev1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(dev1Address);
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
              const developer = await developerContract.getDeveloper(dev1Address);

              expect(developer.pool.level).to.equal(0);
            });
          });

          context("with researcher", () => {
            beforeEach(async () => {
              await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
              await addResearcher("Researcher  A", resea1Address);

              await addWork(resea1Address);

              await instance.connect(validator1Address).addUserValidation(resea1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(resea1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(resea1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(resea1Address);
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
              const reseacher = await researcherContract.getResearcher(resea1Address);

              expect(reseacher.pool.level).to.equal(0);
            });
          });

          context("with activist", () => {
            beforeEach(async () => {
              await addInvitation(owner, activist1Address, userTypes.Activist, owner);
              await addActivist("Activist  A", activist1Address);

              await addInvitation(activist1Address, inspector2Address, userTypes.Inspector, owner);

              await activistContract.addLevel(producer1Address, 0, inspector2Address, 3);

              await instance.connect(validator1Address).addUserValidation(activist1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(activist1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(activist1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(activist1Address);
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
              const activist = await activistContract.getActivist(activist1Address);

              expect(activist.pool.level).to.equal(0);
            });
          });

          context("with validator", () => {
            beforeEach(async () => {
              await instance.connect(validator1Address).addLevel();

              await instance.connect(validator1Address).addUserValidation(validator1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(validator1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(validator1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(validator1Address);
              const DENIED = 9;

              expect(user).to.equal(DENIED);
            });

            it("remove user levels from pool", async () => {
              const levelsEra1 = await validatorPool.eraLevels(1, validator1Address);
              const levelsEra2 = await validatorPool.eraLevels(2, validator1Address);

              expect(levelsEra1).to.equal(0);
              expect(levelsEra2).to.equal(0);
            });

            it("remove user levels from activist", async () => {
              const validator = await instance.getValidator(validator1Address);

              expect(validator.pool.level).to.equal(0);
            });
          });
        });
      });
    });

    context("when caller is not validator", () => {
      it("should return error", async () => {
        expect(instance.connect(otherAddress).addUserValidation(validator1Address, "justification")).to.be.revertedWith(
          "User must be a validator"
        );
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
        expect(instance.connect(otherAddress).addUserValidation(undefinedAddress, "justification")).to.be.revertedWith(
          "User not registered"
        );
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
            producer: producer1Address,
            inspector: inspector1Address,
            isaScore: 10,
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
          expect(
            instance.connect(owner).addInspectionValidation(inspectionMock, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not vote to inspection", () => {
        context("when inspection validations is => majorityValidatorsCount (addPenalty == true)", () => {
          context("when inspector total penalties is >= inspectorContract.maxPenalties", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                producer: producer1Address,
                inspector: inspector1Address,
                isaScore: 20,
                proofPhoto: "",
                report: "",
                validationsCount: 2,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await addInvitation(owner, producer1Address, userTypes.Producer, owner);

              await addProducer("Producer A", producer1Address);
              await addInspector("Inspector A", inspector1Address);

              await inspectorContract.afterAcceptInspection(inspectionMock.inspector, 1);
              await inspectorContract.afterAcceptInspection(inspectionMock.inspector, 1);

              await inspectorContract.afterRealizeInspection(inspectionMock.inspector);
              await inspectorContract.afterRealizeInspection(inspectionMock.inspector);

              await producerContract.afterRealizeInspection(inspectionMock.producer, 10);
              await producerContract.afterRealizeInspection(inspectionMock.producer, 10);
              await producerContract.afterRealizeInspection(inspectionMock.producer, 30);

              await inspectorContract.addPenalty(inspectionMock.inspector, 2);
              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("deny inspector", async () => {
              const newInspectorType = await userContract.getUser(inspectionMock.inspector);

              expect(newInspectorType).to.equal(9);
            });

            it("all inspector contract levels is removed", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.pool.level).to.equal(0);
            });

            it("decrement total inspections of inspector", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.totalInspections).to.equal(1);
            });

            it("decrement total inspections of producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.totalInspections).to.equal(2);
            });

            it("remove inspection isa level from producer isaScore", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(30);
            });

            it("remove inspection isa level from producer pool", async () => {
              const levels = await producerPool.eraLevels(3, producer1Address);

              expect(levels).to.equal(0);
            });
          });

          context("when inspectorTotal penalties is < inspectorContract.maxPenalties", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                producer: producer1Address,
                inspector: inspector1Address,
                isaScore: 20,
                proofPhoto: "",
                report: "",
                validationsCount: 2,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await addInvitation(owner, producer1Address, userTypes.Producer, owner);

              await addProducer("Producer A", producer1Address);
              await addInspector("Inspector A", inspector1Address);

              await inspectorContract.afterAcceptInspection(inspectionMock.inspector, 1);
              await inspectorContract.afterAcceptInspection(inspectionMock.inspector, 1);

              await inspectorContract.afterRealizeInspection(inspectionMock.inspector);
              await inspectorContract.afterRealizeInspection(inspectionMock.inspector);

              await producerContract.afterRealizeInspection(inspectionMock.producer, 10);
              await producerContract.afterRealizeInspection(inspectionMock.producer, 10);
              await producerContract.afterRealizeInspection(inspectionMock.producer, 30);

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("inspector is the same", async () => {
              const newInspectorType = await userContract.getUser(inspectionMock.inspector);

              expect(newInspectorType).to.equal(2);
            });

            it("inspector contract levels is removed", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.pool.level).to.equal(1);
            });

            it("decrement total inspections of inspector", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.totalInspections).to.equal(1);
            });

            it("decrement total inspections of producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.totalInspections).to.equal(2);
            });

            it("remove inspection isa level from producer isaScore", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(30);
            });

            it("remove inspection isa level from producer pool", async () => {
              const levels = await producerPool.eraLevels(3, producer1Address);

              expect(levels).to.equal(0);
            });
          });
        });

        context("when inspection validations is < majorityValidatorsCount (addPenalty == false)", () => {
          beforeEach(async () => {
            inspectionMock = {
              id: 1,
              status: 3,
              producer: producer1Address,
              inspector: inspector1Address,
              isaScore: 20,
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
            const validations = await instance.getInspectionValidations(1);
            const validation = validations[0];

            expect(validations.length).to.equal(1);
            expect(validation.validator).to.equal(validator1Address.address);
            expect(validation.resourceId).to.equal(1);
            expect(validation.justification).to.equal("foo");
            expect(validation.majorityValidatorsCount).to.equal(2);
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        expect(
          instance.connect(owner).addInspectionValidation(1, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addDeveloperContributionValidation", () => {
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

        await developerContract.connect(dev1Address).addContribution("report");
      });

      context("when validator already voted to contribution", () => {
        beforeEach(async () => {
          let contribution = await developerContract.getContribution(1);
          contribution = generateContributionObject(contribution);

          await instance
            .connect(owner)
            .addDeveloperContributionValidation(contribution, "justification", validator1Address);
        });

        it("should return error", async () => {
          let contribution = await developerContract.getContribution(1);
          contribution = generateContributionObject(contribution);

          await expect(
            instance.connect(owner).addDeveloperContributionValidation(contribution, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not vote to contribution", () => {
        context("when contribution validations is => majorityValidatorsCount (addPenalty == true)", () => {
          context("when developer total penalties is >= developerContract.maxPenalties", () => {
            beforeEach(async () => {
              let contribution = await developerContract.getContribution(1);
              contribution = generateContributionObject(contribution);
              contribution.validationsCount = 1;

              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution, "justification", validator1Address);

              contribution.validationsCount = 2;
              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution, "justification", validator2Address);

              await advanceBlock(developerPoolParams.blocksPerEra);
              await developerContract.connect(dev1Address).addContribution("report");

              let contribution2 = await developerContract.getContribution(2);
              contribution2 = generateContributionObject(contribution2);
              contribution2.validationsCount = 1;

              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution2, "justification", validator1Address);

              contribution2.validationsCount = 2;
              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution2, "justification", validator2Address);

              await advanceBlock(developerPoolParams.blocksPerEra);
              await developerContract.connect(dev1Address).addContribution("report");

              let contribution3 = await developerContract.getContribution(3);
              contribution3 = generateContributionObject(contribution3);
              contribution3.validationsCount = 1;

              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution3, "justification", validator1Address);

              contribution3.validationsCount = 2;
              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution3, "justification", validator2Address);
            });

            it("should add work validation", async () => {
              const validations = await instance.getContributionValidations(1);
              const validation = validations[0];

              expect(validations.length).to.equal(2);
              expect(validation.validator).to.equal(validator1Address.address);
              expect(validation.resourceId).to.equal(1);
              expect(validation.justification).to.equal("justification");
              expect(validation.majorityValidatorsCount).to.equal(2);
            });

            it("deny developer", async () => {
              const newDeveloperType = await userContract.getUser(dev1Address);

              expect(newDeveloperType).to.equal(9);
            });

            it("remove contribution isa level from developer pool", async () => {
              const levels = await developerPool.eraLevels(4, dev1Address);

              expect(levels).to.equal(0);
            });
          });

          context("when developer total penalties is < developerContract.maxPenalties", () => {
            beforeEach(async () => {
              let contribution = await developerContract.getContribution(1);
              contribution = generateContributionObject(contribution);
              contribution.validationsCount = 1;

              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution, "justification", validator1Address);

              contribution = await developerContract.getContribution(1);
              contribution = generateContributionObject(contribution);
              contribution.validationsCount = 2;

              await instance
                .connect(owner)
                .addDeveloperContributionValidation(contribution, "justification", validator2Address);
            });

            it("developer is the same", async () => {
              const newDeveloperType = await userContract.getUser(dev1Address);

              expect(newDeveloperType).to.equal(4);
            });

            it("remove contribution isa level from developer pool", async () => {
              const levels = await developerPool.eraLevels(2, dev1Address);

              expect(levels).to.equal(0);
            });
          });
        });

        context("when contribution validations is < majorityValidatorsCount (addPenalty == false)", () => {
          beforeEach(async () => {
            let contribution = await developerContract.getContribution(1);
            contribution = generateContributionObject(contribution);
            contribution.validationsCount = 1;

            await instance
              .connect(owner)
              .addDeveloperContributionValidation(contribution, "justification", validator1Address);
          });

          it("total penalties is zero", async () => {
            const totalPenalties = await developerContract.totalPenalties(dev1Address);

            expect(totalPenalties).to.equal(0);
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        let contribution = await developerContract.getContribution(1);
        contribution = generateContributionObject(contribution);

        await expect(
          instance
            .connect(validator1Address)
            .addDeveloperContributionValidation(contribution, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addResearcherWorkValidation", () => {
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

        await addWork(resea1Address);
      });

      context("when validator already voted to work", () => {
        beforeEach(async () => {
          let work = await researcherContract.works(1);
          work = generateWorkObject(work);

          await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator1Address);
        });

        it("should add work validation", async () => {
          const validations = await instance.getWorkValidations(1);
          const validation = validations[0];

          expect(validations.length).to.equal(1);
          expect(validation.validator).to.equal(validator1Address.address);
          expect(validation.resourceId).to.equal(1);
          expect(validation.justification).to.equal("justification");
          expect(validation.majorityValidatorsCount).to.equal(2);
        });

        it("should return error", async () => {
          let work = await researcherContract.works(1);
          work = generateWorkObject(work);

          await expect(
            instance.connect(owner).addResearcheWorkValidation(work, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not vote to work", () => {
        context("when work validations is => majorityValidatorsCount (addPenalty == true)", () => {
          context("when researcher total penalties is >= researcherContract.maxPenalties", () => {
            beforeEach(async () => {
              let work = await researcherContract.works(1);
              work = generateWorkObject(work);
              work.validationsCount = 1;

              await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator1Address);

              work.validationsCount = 2;
              await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator2Address);

              await advanceBlock(researcherPoolParams.blocksPerEra);
              await addWork(resea1Address);

              let work2 = await researcherContract.works(2);
              work2 = generateWorkObject(work2);
              work2.validationsCount = 1;

              await instance.connect(owner).addResearcheWorkValidation(work2, "justification", validator1Address);

              work2.validationsCount = 2;
              await instance.connect(owner).addResearcheWorkValidation(work2, "justification", validator2Address);

              await advanceBlock(researcherPoolParams.blocksPerEra);
              await addWork(resea1Address);

              let work3 = await researcherContract.works(3);
              work3 = generateWorkObject(work3);
              work3.validationsCount = 1;

              await instance.connect(owner).addResearcheWorkValidation(work3, "justification", validator1Address);

              work3.validationsCount = 2;
              await instance.connect(owner).addResearcheWorkValidation(work3, "justification", validator2Address);
            });

            it("deny researcher", async () => {
              const newResearcherType = await userContract.getUser(resea1Address);

              expect(newResearcherType).to.equal(9);
            });

            it("remove work isa level from researcher pool", async () => {
              const levels = await researcherPool.eraLevels(4, resea1Address);

              expect(levels).to.equal(0);
            });
          });

          context("when researcher total penalties is < researcherContract.maxPenalties", () => {
            beforeEach(async () => {
              let work = await researcherContract.works(1);
              work = generateWorkObject(work);
              work.validationsCount = 1;

              await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator1Address);

              work = await researcherContract.works(1);
              work = generateWorkObject(work);
              work.validationsCount = 2;

              await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator2Address);
            });

            it("researcher is the same", async () => {
              const userType = await userContract.getUser(resea1Address);

              expect(userType).to.equal(3);
            });

            it("remove contribution isa level from researcher pool", async () => {
              let work = await researcherContract.works(1);
              const levels = await researcherPool.eraLevels(work.era, resea1Address);

              expect(levels).to.equal(0);
            });
          });
        });

        context("when work validations is < majorityValidatorsCount (addPenalty == false)", () => {
          beforeEach(async () => {
            let work = await researcherContract.works(1);
            work = generateWorkObject(work);
            work.validationsCount = 1;

            await instance.connect(owner).addResearcheWorkValidation(work, "justification", validator1Address);
          });

          it("total penalties is zero", async () => {
            const totalPenalties = await researcherContract.totalPenalties(resea1Address);

            expect(totalPenalties).to.equal(0);
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        let work = await researcherContract.works(1);
        work = generateWorkObject(work);

        await expect(
          instance.connect(validator1Address).addResearcheWorkValidation(work, "justification", validator1Address)
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

  describe("#getValidators", () => {
    context("when has validators", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should return validators", async () => {
        const validators = await instance.getValidators();

        expect(validators.length).to.equal(1);
      });
    });

    context("when don't has validators", () => {
      it("should return validators equal zero", async () => {
        const validators = await instance.getValidators();

        expect(validators.length).to.equal(0);
      });
    });
  });

  describe("#majorityValidatorsCount", () => {
    context("when have 2 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
      });

      it("returns 1", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();
        const majorityValidatorsCountMinimum = 1;

        expect(majorityValidatorsCount).to.equal(majorityValidatorsCountMinimum);
      });
    });

    context("when have 6 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
      });

      it("returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(3);
      });
    });

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

    context("when have 10 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
      });

      it("returns 2", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(2);
      });
    });

    context("when have 14 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);
        await addInvitation(owner, validator11Address, userTypes.Validator, owner);
        await addInvitation(owner, validator12Address, userTypes.Validator, owner);
        await addInvitation(owner, validator13Address, userTypes.Validator, owner);
        await addInvitation(owner, validator14Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
        await addValidator(validator11Address);
        await addValidator(validator12Address);
        await addValidator(validator13Address);
        await addValidator(validator14Address);
      });

      it("returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(3);
      });
    });

    context("when have 15 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);
        await addInvitation(owner, validator11Address, userTypes.Validator, owner);
        await addInvitation(owner, validator12Address, userTypes.Validator, owner);
        await addInvitation(owner, validator13Address, userTypes.Validator, owner);
        await addInvitation(owner, validator14Address, userTypes.Validator, owner);
        await addInvitation(owner, validator15Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
        await addValidator(validator11Address);
        await addValidator(validator12Address);
        await addValidator(validator13Address);
        await addValidator(validator14Address);
        await addValidator(validator15Address);
      });

      it("returns 1", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(1);
      });
    });
  });

  describe("#addLevel", () => {
    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(producer1Address).addLevel()).to.be.revertedWith("User must be a validator");
      });
    });

    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should add 1 level", async () => {
        await instance.connect(validator1Address).addLevel();

        const validator = await instance.getValidator(validator1Address);

        expect(validator.pool.level).to.equal(1);
      });
    });

    context("when is a validator and has already added a level in that era", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).addLevel();
      });

      it("should return error", async () => {
        await expect(instance.connect(validator1Address).addLevel()).to.be.revertedWith("Only once per era");
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).addLevel();
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

          it("withdraw 1200000000000000000000000 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(validator1Address);
            const expectedBalance = 1200000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });

        context("with two validators", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addValidator(validator2Address);
            await instance.connect(validator2Address).addLevel();

            await advanceBlock(validatorPoolArgs.blocksPerEra);

            await instance.connect(validator1Address).withdraw();
          });

          it("withdraw 600000000000000000000000n tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(validator1Address);
            const expectedBalance = 600000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(producer1Address).withdraw()).to.be.revertedWith("Pool only to validators");
      });
    });
  });
});
