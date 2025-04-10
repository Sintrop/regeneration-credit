const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");

describe("ValidationRules", () => {
  let instance;
  let communityRules;
  let regeneratorRules;
  let regeneratorPool;
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
    user1Address,
    user2Address,
    user3Address,
    user4Address,
    user5Address,
    user6Address,
    user7Address,
    user8Address,
    user9Address,
    user10Address,
    user11Address,
    user12Address,
    user13Address,
    user14Address,
    user15Address,
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

  const timeBetweenVotes = 10;

  beforeEach(async () => {
    [
      owner,
      regenerator1Address,
      regenerator2Address,
      inspector1Address,
      inspector2Address,
      user1Address,
      user2Address,
      user3Address,
      user4Address,
      user5Address,
      user6Address,
      user7Address,
      user8Address,
      user9Address,
      user10Address,
      user11Address,
      user12Address,
      user13Address,
      user14Address,
      user15Address,
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

    const validationRulesFactory = await ethers.getContractFactory("ValidationRules");
    instance = await validationRulesFactory.deploy(timeBetweenVotes);

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

    const voteRulesFactory = await ethers.getContractFactory("VoteRules");
    voteRules = await voteRulesFactory.deploy(
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
    await developerPool.newAllowedCaller(developerRules.target);
    await researcherPool.newAllowedCaller(researcherRules.target);
    await contributorPool.newAllowedCaller(contributorRules.target);
    await activistPool.newAllowedCaller(activistRules.target);
    await inspectorPool.newAllowedCaller(inspectorRules.target);
    await inspectorRules.newAllowedCaller(instance.target);
    await inspectorRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await instance.newAllowedCaller(developerRules);

    await instance.setContractAddressDependencies(validationRulesDependencies);

    await regenerationCredit.addContractPool(regeneratorRules.target, regeneratorPoolArgs.totalTokens);

    await addInvitation(owner, inspector1Address, userTypes.Inspector, owner);
  });

  describe("#addUserValidation", () => {
    context("when caller is validator", () => {
      context("when user already is denied", () => {
        beforeEach(async () => {
          await addInvitation(owner, dev1Address, userTypes.Developer, owner);
          await addInvitation(owner, dev2Address, userTypes.Developer, owner);

          await addDeveloper("Developer  A", dev1Address);
          await addDeveloper("Developer  B", dev2Address);

          await denyUser(dev2Address);
        });

        it("should return error", async () => {
          await expect(
            instance.connect(dev1Address).addUserValidation(dev2Address, "justification")
          ).to.be.revertedWith("User already denied");
        });
      });

      context("when user is not denied", () => {
        context("when user validations count is less than votesToInvalidate", () => {
          context("with developer", () => {
            context("when total users is less than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, dev1Address, userTypes.Developer, owner);
                await addInvitation(owner, dev2Address, userTypes.Developer, owner);

                await addDeveloper("Developer  A", dev1Address);
                await addDeveloper("Developer  B", dev2Address);

                await instance.connect(dev1Address).addUserValidation(dev2Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(dev2Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(dev2Address);
                const DEVELOPER = 4;

                expect(user).to.equal(DEVELOPER);
              });
            });

            context("when total users is bigger than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, dev1Address, userTypes.Developer, owner);
                await addInvitation(owner, dev2Address, userTypes.Developer, owner);
                await addInvitation(owner, user1Address, userTypes.Developer, owner);
                await addInvitation(owner, user2Address, userTypes.Developer, owner);
                await addInvitation(owner, user3Address, userTypes.Developer, owner);
                await addInvitation(owner, user4Address, userTypes.Developer, owner);

                await addDeveloper("Developer  A", dev1Address);
                await addDeveloper("Developer  B", dev2Address);
                await addDeveloper("Developer  C", user1Address);
                await addDeveloper("Developer  D", user2Address);
                await addDeveloper("Developer  E", user3Address);
                await addDeveloper("Developer  F", user4Address);
              });

              context("when user levels is less than total users levels avg", () => {
                it("should return error", async () => {
                  await expect(
                    instance.connect(dev1Address).addUserValidation(dev2Address, "my justification")
                  ).to.be.revertedWith("User can not vote");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await developerRules.connect(dev1Address).addReport("description", "report");

                  await instance.connect(dev1Address).addUserValidation(dev2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(dev2Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(1);
                });

                it("user type must be the same", async () => {
                  const user = await communityRules.getUser(dev2Address);
                  const DEVELOPER = 4;

                  expect(user).to.equal(DEVELOPER);
                });
              });
            });
          });

          context("with contributor", () => {
            context("when total users is less than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Contributor, owner);
                await addInvitation(owner, user2Address, userTypes.Contributor, owner);

                await addContributor("Contributor A", user1Address);
                await addContributor("Contributor  B", user2Address);

                await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(user2Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(user2Address);
                const CONTRIBUTOR = 5;

                expect(user).to.equal(CONTRIBUTOR);
              });
            });

            context("when total users is bigger than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Contributor, owner);
                await addInvitation(owner, user2Address, userTypes.Contributor, owner);
                await addInvitation(owner, user3Address, userTypes.Contributor, owner);
                await addInvitation(owner, user4Address, userTypes.Contributor, owner);
                await addInvitation(owner, user5Address, userTypes.Contributor, owner);
                await addInvitation(owner, user6Address, userTypes.Contributor, owner);

                await addContributor("User  A", user1Address);
                await addContributor("User  B", user2Address);
                await addContributor("User  C", user3Address);
                await addContributor("User  D", user4Address);
                await addContributor("User  E", user5Address);
                await addContributor("User  F", user6Address);
              });

              context("when user levels is less than total users levels avg", () => {
                it("should return error", async () => {
                  await expect(
                    instance.connect(user1Address).addUserValidation(user2Address, "my justification")
                  ).to.be.revertedWith("User can not vote");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await contributorRules.connect(user1Address).addContribution("description", "report");

                  await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(user2Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(1);
                });

                it("user type must be the same", async () => {
                  const user = await communityRules.getUser(user2Address);
                  const USER_TYPE = 5;

                  expect(user).to.equal(USER_TYPE);
                });
              });
            });
          });

          context("with researcher", () => {
            context("when total users is less than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Researcher, owner);
                await addInvitation(owner, user2Address, userTypes.Researcher, owner);

                await addResearcher("User A", user1Address);
                await addResearcher("User  B", user2Address);

                await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(user2Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(user2Address);
                const USER_TYPE = 3;

                expect(user).to.equal(USER_TYPE);
              });
            });

            context("when total users is bigger than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Researcher, owner);
                await addInvitation(owner, user2Address, userTypes.Researcher, owner);
                await addInvitation(owner, user3Address, userTypes.Researcher, owner);
                await addInvitation(owner, user4Address, userTypes.Researcher, owner);
                await addInvitation(owner, user5Address, userTypes.Researcher, owner);
                await addInvitation(owner, user6Address, userTypes.Researcher, owner);

                await addResearcher("User  A", user1Address);
                await addResearcher("User  B", user2Address);
                await addResearcher("User  C", user3Address);
                await addResearcher("User  D", user4Address);
                await addResearcher("User  E", user5Address);
                await addResearcher("User  F", user6Address);
              });

              context("when user levels is less than total users levels avg", () => {
                it("should return error", async () => {
                  await expect(
                    instance.connect(user1Address).addUserValidation(user2Address, "my justification")
                  ).to.be.revertedWith("User can not vote");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await researcherRules.connect(user1Address).addResearch("title", "thesis", "fileURL");

                  await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(user2Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(1);
                });

                it("user type must be the same", async () => {
                  const user = await communityRules.getUser(user2Address);
                  const USER_TYPE = 3;

                  expect(user).to.equal(USER_TYPE);
                });
              });
            });
          });

          context("with activist", () => {
            context("when total users is less than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Activist, owner);
                await addInvitation(owner, user2Address, userTypes.Activist, owner);

                await addActivist("User A", user1Address);
                await addActivist("User  B", user2Address);

                await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(user2Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(user2Address);
                const USER_TYPE = 6;

                expect(user).to.equal(USER_TYPE);
              });
            });

            context("when total users is bigger than 5", () => {
              beforeEach(async () => {
                await addInvitation(owner, user1Address, userTypes.Activist, owner);
                await addInvitation(owner, user2Address, userTypes.Activist, owner);
                await addInvitation(owner, user3Address, userTypes.Activist, owner);
                await addInvitation(owner, user4Address, userTypes.Activist, owner);
                await addInvitation(owner, user5Address, userTypes.Activist, owner);
                await addInvitation(owner, user6Address, userTypes.Activist, owner);

                await addActivist("User  A", user1Address);
                await addActivist("User  B", user2Address);
                await addActivist("User  C", user3Address);
                await addActivist("User  D", user4Address);
                await addActivist("User  E", user5Address);
                await addActivist("User  F", user6Address);
              });

              context("when user levels is less than total users levels avg", () => {
                it("should return error", async () => {
                  await expect(
                    instance.connect(user1Address).addUserValidation(user2Address, "my justification")
                  ).to.be.revertedWith("User can not vote");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await communityRules.newAllowedCaller(user1Address);

                  await addInvitation(user1Address, user7Address, userTypes.Regenerator, user1Address);
                  await addInvitation(user1Address, user8Address, userTypes.Regenerator, user1Address);

                  await activistRules.addLevel(user7Address, 3, user8Address, 3);

                  await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(user2Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(1);
                });

                it("user type must be the same", async () => {
                  const user = await communityRules.getUser(user2Address);
                  const USER_TYPE = 6;

                  expect(user).to.equal(USER_TYPE);
                });
              });
            });
          });
        });

        context("when user validations count is equal or bigger than votesToInvalidate", () => {
          beforeEach(async () => {
            await addInvitation(owner, user1Address, userTypes.Developer, owner);
            await addInvitation(owner, user2Address, userTypes.Developer, owner);
            await addInvitation(owner, user3Address, userTypes.Developer, owner);
            await addInvitation(owner, user4Address, userTypes.Developer, owner);
            await addInvitation(owner, user5Address, userTypes.Developer, owner);
            await addInvitation(owner, user6Address, userTypes.Developer, owner);

            await addDeveloper("User  A", user1Address);
            await addDeveloper("User  B", user2Address);
            await addDeveloper("User  C", user3Address);
            await addDeveloper("User  F", user4Address);
            await addDeveloper("User  D", user5Address);
            await addDeveloper("User  E", user6Address);

            await developerRules.connect(user1Address).addReport("description", "report");
            await developerRules.connect(user2Address).addReport("description", "report");
          });

          context("when current era is 1", () => {
            context("with regenerator", () => {
              beforeEach(async () => {
                await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);

                await addRegenerator("Regenerator A", regenerator1Address);
                await addRegenerator("Regenerator B", regenerator2Address);

                await instance.connect(user1Address).addUserValidation(regenerator1Address, "my justification");

                receipt = await instance
                  .connect(user2Address)
                  .addUserValidation(regenerator1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(regenerator1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(regenerator1Address);
                const DENIED = 8;

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

                await instance.connect(user1Address).addUserValidation(inspector1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(inspector1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(inspector1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(inspector1Address);
                const DENIED = 8;

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

                await instance.connect(user1Address).addUserValidation(contributor1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(contributor1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(contributor1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(contributor1Address);
                const DENIED = 8;

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

                await instance.connect(user1Address).addUserValidation(dev1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(dev1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(dev1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(dev1Address);
                const DENIED = 8;

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

                expect(userTypesCount).to.equal(7);
              });
            });

            context("with researcher", () => {
              beforeEach(async () => {
                await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
                await addInvitation(owner, resea2Address, userTypes.Researcher, owner);
                await addResearcher("Researcher  A", resea1Address);
                await addResearcher("Researcher  B", resea2Address);

                await addResearch(resea1Address);

                await instance.connect(user1Address).addUserValidation(resea1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(resea1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(resea1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(resea1Address);
                const DENIED = 8;

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

                await instance.connect(user1Address).addUserValidation(activist1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(activist1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(activist1Address);

                expect(validations[0].justification).to.equal("my justification");
                expect(validations.length).to.equal(2);
              });

              it("user type must be denied", async () => {
                const user = await communityRules.getUser(activist1Address);
                const DENIED = 8;

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
          });

          context("when current era is 2", () => {
            context("when validators have contributed to last era", () => {
              beforeEach(async () => {});

              context("when add validation", () => {
                beforeEach(async () => {
                  await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                  await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
                  await addRegenerator("Regenerator A", regenerator1Address);
                  await addRegenerator("Regenerator B", regenerator2Address);

                  await instance.connect(user1Address).addUserValidation(regenerator1Address, "my justification");
                  await instance.connect(user2Address).addUserValidation(regenerator1Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(regenerator1Address);

                  expect(validations[0].justification).to.equal("my justification");
                  expect(validations.length).to.equal(2);
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
          instance.connect(otherAddress).addUserValidation(user1Address, "justification")
        ).to.be.revertedWith("Not a voter user");
      });
    });

    context("when validator already voted to user", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);

        await instance.connect(user1Address).addUserValidation(user2Address, "justification");
      });

      it("should return error", async () => {
        await expect(
          instance.connect(user1Address).addUserValidation(user2Address, "justification")
        ).to.be.revertedWith("Already voted");
      });
    });

    context("when is not a registered user", () => {
      it("should return error", async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addDeveloper("User  A", user1Address);

        await expect(
          instance.connect(user1Address).addUserValidation(undefinedAddress, "justification")
        ).to.be.revertedWith("User not registered");
      });
    });
  });

  describe("#addInspectionValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);
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

          await instance.connect(owner).addInspectionValidation(inspectionMock, "justification", user1Address);
        });

        it("should return error", async () => {
          await expect(
            instance.connect(owner).addInspectionValidation(inspectionMock, "justification", user1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to inspection", () => {
        context("when current era is 1", () => {
          context("when inspection validations is => votesToInvalidate (addPenalty == true)", () => {
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
                await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", user1Address);
              });

              it("deny inspector", async () => {
                const newInspectorType = await communityRules.getUser(inspectionMock.inspector);

                expect(newInspectorType).to.equal(8);
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

                await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", user1Address);
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

          context("when inspection validations is < votesToInvalidate (addPenalty == false)", () => {
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

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", user1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.inspectionValidations(1, 0);

              expect(validation[0]).to.equal(user1Address.address);
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

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", user1Address);
            });

            it("add inspection validation", async () => {
              const validation = await instance.inspectionValidations(1, 0);

              expect(validation[0]).to.equal(user1Address.address);
              expect(validation[1]).to.equal(1);
              expect(validation[2]).to.equal("foo");
              expect(validation[3]).to.equal(2);
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
          instance.connect(dev1Address).addInspectionValidation(inspectionMock, "justification", user1Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addDeveloperReportValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, dev1Address, userTypes.Developer, owner);
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);
        await addDeveloper("User C", dev1Address);

        await developerRules.connect(dev1Address).addReport("description", "report");
      });

      context("when validator already voted to report", () => {
        beforeEach(async () => {
          let report = await developerRules.getReport(1);
          report = generateReportObject(report);

          await instance.connect(owner).addDeveloperReportValidation(report, "justification", user1Address);
        });

        it("should return error", async () => {
          let report = await developerRules.getReport(1);
          report = generateReportObject(report);

          await expect(
            instance.connect(owner).addDeveloperReportValidation(report, "justification", user1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to report", () => {
        context("when current era is 1", () => {
          context("when report validations is => votesToInvalidate (addPenalty == true)", () => {
            context("when developer total penalties is >= developerRules.maxPenalties", () => {
              beforeEach(async () => {
                let report = await developerRules.getReport(1);
                report = generateReportObject(report);
                report.validationsCount = 1;

                await developerRules.addPenalty(dev1Address, report.id);
                await developerRules.addPenalty(dev1Address, report.id);

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", user1Address);

                report.validationsCount = 2;
                await instance.connect(owner).addDeveloperReportValidation(report, "justification", user2Address);
              });

              it("should add research validation", async () => {
                const validation = await instance.reportValidations(1, 0);

                expect(validation[0]).to.equal(user1Address.address);
                expect(validation[1]).to.equal(1);
                expect(validation[2]).to.equal("justification");
                expect(validation[3]).to.equal(2);
              });

              it("deny developer", async () => {
                const newDeveloperType = await communityRules.getUser(dev1Address);

                expect(newDeveloperType).to.equal(8);
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

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", user1Address);

                report = await developerRules.getReport(1);
                report = generateReportObject(report);
                report.validationsCount = 2;

                await instance.connect(owner).addDeveloperReportValidation(report, "justification", user2Address);
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

          context("when report validations is < votesToInvalidate (addPenalty == false)", () => {
            beforeEach(async () => {
              let report = await developerRules.getReport(1);
              report = generateReportObject(report);
              report.validationsCount = 1;

              await instance.connect(owner).addDeveloperReportValidation(report, "justification", user1Address);
            });

            it("total penalties is zero", async () => {
              const totalPenalties = await developerRules.totalPenalties(dev1Address);

              expect(totalPenalties).to.equal(0);
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
          instance.connect(user1Address).addDeveloperReportValidation(report, "justification", user2Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addResearcherResearchValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
        await addResearcher("Researcher A", resea1Address);

        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);

        await addResearch(resea1Address);
      });

      context("when validator already voted to research", () => {
        beforeEach(async () => {
          let research = await researcherRules.researches(1);
          research = generateResearchObject(research);

          await instance.connect(owner).addResearcherResearchValidation(research, "justification", user1Address);
        });

        it("should add research validation", async () => {
          const validation = await instance.researchValidations(1, 0);

          expect(validation[0]).to.equal(user1Address.address);
          expect(validation[1]).to.equal(1);
          expect(validation[2]).to.equal("justification");
          expect(validation[3]).to.equal(2);
        });

        it("should return error", async () => {
          let research = await researcherRules.researches(1);
          research = generateResearchObject(research);

          await expect(
            instance.connect(owner).addResearcherResearchValidation(research, "justification", user1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not voted to research", () => {
        context("when current era is 1", () => {
          context("when research validations is => votesToInvalidate (addPenalty == true)", () => {
            context("when researcher total penalties is >= researcherRules.maxPenalties", () => {
              beforeEach(async () => {
                let research = await researcherRules.researches(1);
                research = generateResearchObject(research);
                research.validationsCount = 1;

                await researcherRules.addPenalty(research.createdBy, research.id);
                await researcherRules.addPenalty(research.createdBy, research.id);

                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", user1Address);

                research.validationsCount = 2;
                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", user2Address);
              });

              it("deny researcher", async () => {
                const newResearcherType = await communityRules.getUser(resea1Address);

                expect(newResearcherType).to.equal(8);
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
                  .addResearcherResearchValidation(research, "justification", user1Address);

                research = await researcherRules.researches(1);
                research = generateResearchObject(research);
                research.validationsCount = 2;

                await instance
                  .connect(owner)
                  .addResearcherResearchValidation(research, "justification", user2Address);
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

          context("when research validations is < votesToInvalidate (addPenalty == false)", () => {
            beforeEach(async () => {
              let research = await researcherRules.researches(1);
              research = generateResearchObject(research);
              research.validationsCount = 1;

              await instance
                .connect(owner)
                .addResearcherResearchValidation(research, "justification", user1Address);
            });

            it("total penalties is zero", async () => {
              const totalPenalties = await researcherRules.totalPenalties(resea1Address);

              expect(totalPenalties).to.equal(0);
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
            .connect(user1Address)
            .addResearcherResearchValidation(research, "justification", user2Address)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#votesToInvalidate", () => {
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
          const votesToInvalidate = await instance.votesToInvalidate();

          expect(votesToInvalidate).to.equal(4);
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
            const votesToInvalidate = await instance.votesToInvalidate();

            expect(votesToInvalidate).to.equal(2);
          });
        });

        context("when no validators have contributed in era 1", () => {
          beforeEach(async () => {
            await advanceBlock(validatorPoolArgs.blocksPerEra);
          });

          it("returns 0", async () => {
            const votesToInvalidate = await instance.votesToInvalidate();

            expect(votesToInvalidate).to.equal(0);
          });
        });
      });
    });
  });
});
