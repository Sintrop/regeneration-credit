const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");
const hre = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

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
  let inspectionRules;
  let validationPool;

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
    user16Address,
    user17Address,
    user18Address,
    user19Address,
    user20Address,
    user21Address,
    user22Address,
    user23Address,
    user24Address,
    user25Address,
    user26Address,
    user27Address,
    user28Address,
    user29Address,
    user30Address,
    user31Address,
    user32Address,
    user33Address,
    user34Address,
    user35Address,
    user36Address,
    user37Address,
    user38Address,
    user39Address,
    user40Address,
    user41Address,
    user42Address,
    user43Address,
    user44Address,
    user45Address,
    user46Address,
    user47Address,
    user48Address,
    user49Address,
    user50Address,
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

  let validationPoolParams = {
    totalTokens: "10000000000000000000000000",
    halving: 12,
    blocksPerEra: 160,
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
    await regeneratorRules.connect(from).addRegenerator(2500, name, "projectDescription", "photoURL", coordinates());
  };

  const addSupporter = async (name, from) => {
    await supporterRules.connect(from).addSupporter(name, "photoURL", "description");
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
    await communityRules.setToDenied(userAddress);
  };

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
      user16Address,
      user17Address,
      user18Address,
      user19Address,
      user20Address,
      user21Address,
      user22Address,
      user23Address,
      user24Address,
      user25Address,
      user26Address,
      user27Address,
      user28Address,
      user29Address,
      user30Address,
      user31Address,
      user32Address,
      user33Address,
      user34Address,
      user35Address,
      user36Address,
      user37Address,
      user38Address,
      user39Address,
      user40Address,
      user41Address,
      user42Address,
      user43Address,
      user44Address,
      user45Address,
      user46Address,
      user47Address,
      user48Address,
      user49Address,
      user50Address,
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

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    regeneratorRules = validatorRulesDeployed.regeneratorRules;
    developerRules = validatorRulesDeployed.developerRules;
    researcherRules = validatorRulesDeployed.researcherRules;
    activistRules = validatorRulesDeployed.activistRules;
    activistPool = validatorRulesDeployed.activistPool;
    contributorRules = validatorRulesDeployed.contributorRules;
    contributorPool = validatorRulesDeployed.contributorPool;
    regeneratorPool = validatorRulesDeployed.regeneratorPool;
    researcherPool = validatorRulesDeployed.researcherPool;
    developerPool = validatorRulesDeployed.developerPool;
    inspectorRules = validatorRulesDeployed.inspectorRules;
    inspectorPool = validatorRulesDeployed.inspectorPool;
    inspectionRules = validatorRulesDeployed.inspectionRules;
    instance = validatorRulesDeployed.validationRules;
    validationPool = validatorRulesDeployed.validationPool;

    const supporterRulesFactory = await ethers.getContractFactory("SupporterRules");
    supporterRules = await supporterRulesFactory.deploy(communityRules.target, researcherRules.target, instance.target);

    await regenerationCredit.addContractPool(validationPool, validationPoolParams.totalTokens);
    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(regeneratorRules.target);
    await communityRules.newAllowedCaller(inspectorRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(supporterRules.target);
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
    await contributorRules.newAllowedCaller(owner);
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
    await validationPool.newAllowedCaller(instance);

    await regenerationCredit.addContractPool(regeneratorRules.target, regeneratorPoolArgs.totalTokens);

    await communityRules.setContractCall(owner, instance);
    await activistRules.setContractCall(owner, instance);
    await regeneratorRules.setContractCall(owner, instance);
    await inspectorRules.setContractCall(owner, instance);
    await developerRules.setContractCall(instance);
    await researcherRules.setContractCall(instance);
    await contributorRules.setContractCall(instance);
    await activistPool.setContractCall(activistRules.target);
    await contributorPool.setContractCall(contributorRules.target);
    await developerPool.setContractCall(developerRules.target);
    await researcherPool.setContractCall(researcherRules.target);
    await inspectorPool.setContractCall(inspectorRules.target);
    await regeneratorPool.setContractCall(regeneratorRules.target);
    await validationPool.setContractCall(instance);

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

          await communityRules.setContractCall(owner, owner);

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
                const validations = await instance.getUserValidations(dev2Address, 1);

                expect(validations).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(dev2Address);
                const DEVELOPER = 4;

                expect(user).to.equal(DEVELOPER);
              });

              it("inviter must not get penalty", async () => {
                const inviterPenalties = await communityRules.inviterPenalties(owner);

                expect(inviterPenalties).to.equal(0);
              });

              it("does not set one level to hunter address", async () => {
                const eraLevels = await validationPool.eraLevels(1, dev1Address);

                expect(eraLevels).to.equal(0);
              });

              it("should increment the voter's validationPoints by one", async () => {
                const validationPoints = await instance.validationPoints(dev1Address);
                expect(validationPoints).to.equal(1);
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
                  ).to.be.revertedWith("Not a voter");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await developerRules.connect(dev1Address).addReport("description", "report");

                  await instance.connect(dev1Address).addUserValidation(dev2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(dev2Address, 1);

                  expect(validations).to.equal(1);
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
                const validations = await instance.getUserValidations(user2Address, 1);

                expect(validations).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(user2Address);
                const CONTRIBUTOR = 5;

                expect(user).to.equal(CONTRIBUTOR);
              });

              it("inviter must not get penalty", async () => {
                const inviterPenalties = await communityRules.inviterPenalties(owner);

                expect(inviterPenalties).to.equal(0);
              });

              it("should increment the voter's validationPoints by one", async () => {
                const validationPoints = await instance.validationPoints(user1Address);
                expect(validationPoints).to.equal(1);
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
                  ).to.be.revertedWith("Not a voter");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await contributorRules.connect(user1Address).addContribution("description", "report");

                  await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(user2Address, 1);

                  expect(validations).to.equal(1);
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
                const validations = await instance.getUserValidations(user2Address, 1);

                expect(validations).to.equal(1);
              });

              it("user type must be the same", async () => {
                const user = await communityRules.getUser(user2Address);
                const USER_TYPE = 3;

                expect(user).to.equal(USER_TYPE);
              });

              it("inviter must not get penalty", async () => {
                const inviterPenalties = await communityRules.inviterPenalties(owner);

                expect(inviterPenalties).to.equal(0);
              });

              it("should increment the voter's validationPoints by one", async () => {
                const validationPoints = await instance.validationPoints(user1Address);
                expect(validationPoints).to.equal(1);
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
                  ).to.be.revertedWith("Not a voter");
                });
              });

              context("when user levels is bigger than total users levels avg", () => {
                beforeEach(async () => {
                  await researcherRules.connect(user1Address).addResearch("title", "thesis", "fileURL");

                  await instance.connect(user1Address).addUserValidation(user2Address, "my justification");
                });

                it("should add validation", async () => {
                  const validations = await instance.getUserValidations(user2Address, 1);

                  expect(validations).to.equal(1);
                });

                it("user type must be the same", async () => {
                  const user = await communityRules.getUser(user2Address);
                  const USER_TYPE = 3;

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
                const validations = await instance.getUserValidations(regenerator1Address, 1);

                expect(validations).to.equal(2);
              });

              it("user type must be denied", async () => {
                const isDenied = await communityRules.isDenied(regenerator1Address);

                expect(isDenied).to.equal(true);
              });

              it("inviter must get 1 penalty", async () => {
                const inviterPenalties = await communityRules.inviterPenalties(owner);

                expect(inviterPenalties).to.equal(1);
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

                expect(decrementedArea).to.equal(2500);
              });

              it("must emit DeniedUserEvent", async () => {
                await expect(receipt).to.emit(communityRules, "DeniedUserEvent").withArgs(regenerator1Address);
              });

              it("should increment the voter's totalValidationLevels by one", async () => {
                const totalLevels = await instance.totalValidationLevels(user1Address);
                expect(totalLevels).to.equal(1);
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

                await inspectorRules.afterRealizeInspection(inspector1Address, 1, 1);
                await inspectorRules.afterRealizeInspection(inspector1Address, 1, 1);
                await inspectorRules.afterRealizeInspection(inspector1Address, 1, 1);

                await instance.connect(user1Address).addUserValidation(inspector1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(inspector1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(inspector1Address, 5);

                expect(validations).to.equal(2);
              });

              it("user must be denied", async () => {
                const isDenied = await communityRules.isDenied(inspector1Address);

                expect(isDenied).to.equal(true);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await inspectorPool.eraLevels(1, inspector1Address);
                const levelsEra2 = await inspectorPool.eraLevels(2, inspector1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("do not remove user levels from inspector", async () => {
                const inspector = await inspectorRules.getInspector(inspector1Address);

                expect(inspector.pool.level).to.equal(3);
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
                const validations = await instance.getUserValidations(contributor1Address, 1);

                expect(validations).to.equal(2);
              });

              it("user must be denied", async () => {
                const isDenied = await communityRules.isDenied(contributor1Address);

                expect(isDenied).to.equal(true);
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
                const validations = await instance.getUserValidations(dev1Address, 1);

                expect(validations).to.equal(2);
              });

              it("user must be denied", async () => {
                const isDenied = await communityRules.isDenied(dev1Address);

                expect(isDenied).to.equal(true);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await developerPool.eraLevels(1, dev1Address);
                const levelsEra2 = await developerPool.eraLevels(2, dev1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("do not remove user levels from developer", async () => {
                const developer = await developerRules.getDeveloper(dev1Address);

                expect(developer.pool.level).to.equal(1);
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
                const validations = await instance.getUserValidations(resea1Address, 1);

                expect(validations).to.equal(2);
              });

              it("user must be denied", async () => {
                const isDenied = await communityRules.isDenied(resea1Address);

                expect(isDenied).to.equal(true);
              });

              it("remove user levels from pool", async () => {
                const levelsEra1 = await researcherPool.eraLevels(1, resea1Address);
                const levelsEra2 = await researcherPool.eraLevels(2, resea1Address);

                expect(levelsEra1).to.equal(0);
                expect(levelsEra2).to.equal(0);
              });

              it("do not remove user levels from researcher", async () => {
                const reseacher = await researcherRules.getResearcher(resea1Address);

                expect(reseacher.pool.level).to.equal(1);
              });

              it("userTypesCount must be decremented", async () => {
                const userTypesCount = await communityRules.userTypesCount(userTypes.Researcher);

                expect(userTypesCount).to.equal(1);
              });
            });
          });

          context("when current era is 2", () => {
            context("when add validation", () => {
              beforeEach(async () => {
                await addInvitation(owner, regenerator1Address, userTypes.Regenerator, owner);
                await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
                await addRegenerator("Regenerator A", regenerator1Address);
                await addRegenerator("Regenerator B", regenerator2Address);

                await instance.connect(user1Address).addUserValidation(regenerator1Address, "my justification");

                const nextEraIn = await regeneratorRules.nextEraIn();
                await advanceBlock(nextEraIn);

                await instance.connect(user1Address).addUserValidation(regenerator1Address, "my justification");
                await instance.connect(user2Address).addUserValidation(regenerator1Address, "my justification");
              });

              it("should add validation", async () => {
                const validations = await instance.getUserValidations(regenerator1Address, 2);

                expect(validations).to.equal(2);
              });

              it("user type must be denied", async () => {
                const isDenied = await communityRules.isDenied(regenerator1Address);

                expect(isDenied).to.equal(true);
              });

              it("set hunter as user1Address", async () => {
                const hunterInvalidationVoter1 = await instance.hunterVoter(regenerator1Address, 1);
                const hunterInvalidationVoter2 = await instance.hunterVoter(regenerator1Address, 2);

                expect(hunterInvalidationVoter1).to.equal(user1Address);
                expect(hunterInvalidationVoter2).to.equal(user1Address);
              });

              it("set one level to hunter address", async () => {
                const eraLevels = await validationPool.eraLevels(5, user1Address);

                expect(eraLevels).to.equal(1);
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

    context("when do not wait waitedTimeBetweenVotes", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);
        await addDeveloper("User  C", user3Address);

        await instance.connect(user1Address).addUserValidation(user2Address, "justification");
      });

      it("should return error", async () => {
        await expect(
          instance.connect(user1Address).addUserValidation(user3Address, "justification")
        ).to.be.revertedWith("Wait timeBetweenVotes");
      });
    });

    context("when do not wait waitedTimeBetweenVotes", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);

        await addDeveloper("User  A", user1Address);
        await addDeveloper("User  B", user2Address);
        await addDeveloper("User  C", user3Address);

        await instance.connect(user1Address).addUserValidation(user2Address, "justification");
        await advanceBlock(10);
      });

      it("should return error", async () => {
        await expect(
          instance.connect(user1Address).addUserValidation(user3Address, "justification")
        ).not.be.revertedWith("Wait timeBetweenVotes");
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

    context("when user is a supporter", () => {
      it("should return error", async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addDeveloper("User  A", user1Address);

        await addSupporter("User  A", user8Address);

        await expect(
          instance.connect(user1Address).addUserValidation(user8Address, "justification")
        ).to.be.revertedWith("Supporter validation not allowed");
      });
    });

    context("when regenerator _canBeValidated", () => {
      context("when reached REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Developer, owner);
          await addDeveloper("User  A", user1Address);

          await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
          await addRegenerator("Regenerator", user2Address);

          await regeneratorRules.afterRealizeInspection(user2Address, 1, 1);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 2);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 3);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 4);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 5);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 6);
        });

        it("must returns error message", async () => {
          await expect(
            instance.connect(user1Address).addUserValidation(user2Address.address, "justification")
          ).to.be.revertedWith("Regenerator has reached validation immunity");
        });
      });

      context("when do not reached REGENERATOR_VALIDATION_IMMUNITY_THRESHOLD", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Developer, owner);
          await addDeveloper("User  A", user1Address);

          await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
          await addRegenerator("Regenerator", user2Address);

          await regeneratorRules.afterRealizeInspection(user2Address, 1, 1);
          await regeneratorRules.afterRealizeInspection(user2Address, 1, 2);

          await instance.connect(user1Address).addUserValidation(user2Address.address, "justification");
        });

        it("should add validation", async () => {
          const validations = await instance.getUserValidations(user2Address, 1);

          expect(validations).to.equal(1);
        });

        it("user type must be the same", async () => {
          const user = await communityRules.getUser(user2Address);

          expect(user).to.equal(userTypes.Regenerator);
        });
      });
    });
  });

  describe("#votesToInvalidate", () => {
    beforeEach(async () => {
      const myContractArtifact = await hre.artifacts.readArtifact("CommunityRules");

      const { _, abi } = myContractArtifact;

      mockContract = await deployMockContract(owner, abi);

      const validationRulesDependencies = {
        communityRulesAddress: mockContract.target,
        regeneratorRulesAddress: regeneratorRules.target,
        inspectorRulesAddress: inspectorRules.target,
        developerRulesAddress: developerRules.target,
        researcherRulesAddress: researcherRules.target,
        contributorRulesAddress: contributorRules.target,
        activistRulesAddress: activistRules.target,
        voteRulesAddress: ZERO_ADDRESS,
        validationPoolAddress: validationPool.target,
      };

      await instance.setContractInterfaces(validationRulesDependencies);
    });

    context("when voters is less then 10", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(8);
      });

      it("returns 2", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(2);
      });
    });

    context("when voters is 20", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(20);
      });

      it("returns 2", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(5);
      });
    });

    context("when votersCount is less than 166", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(166);
      });

      it("returns 5", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(5);
      });
    });

    context("when votersCount is 168", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(168);
      });

      it("returns 6", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(6);
      });
    });

    context("when votersCount is 249", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(249);
      });

      it("returns 8", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(8);
      });
    });

    context("when votersCount is 255", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(255);
      });

      it("returns 8", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(8);
      });
    });

    context("when votersCount is 600", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(600);
      });

      it("returns 19", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(19);
      });
    });

    context("when votersCount is 1200", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(1200);
      });

      it("returns 37", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(37);
      });
    });

    context("when votersCount is 2500", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(2500);
      });

      it("returns 76", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(76);
      });
    });

    context("when votersCount is 5000", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(5000);
      });

      it("returns 151", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(151);
      });
    });

    context("when votersCount is 10000", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(10000);
      });

      it("returns 301", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(301);
      });
    });

    context("when votersCount is 20000", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(20000);
      });

      it("returns 360", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(360);
      });
    });

    context("wwhen votersCount is 35000", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(35000);
      });

      it("returns 360", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(360);
      });
    });

    context("when votersCounts is 48000", () => {
      beforeEach(async () => {
        await mockContract.mock.votersCount.returns(48000);
      });

      it("returns 360", async () => {
        const votesToInvalidate = await instance.votesToInvalidate();

        expect(votesToInvalidate).to.equal(360);
      });
    });
  });

  describe("#withdraw", () => {
    context("when is developer", () => {
      beforeEach(async () => {
        await addInvitation(owner, dev1Address, userTypes.Developer, owner);
        await addDeveloper("Developer A", dev1Address);

        await addInvitation(owner, dev2Address, userTypes.Developer, owner);
        await addDeveloper("Developer B", dev2Address);

        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addDeveloper("Developer C", user1Address);
      });

      context("when can withdraw tokens", () => {
        context("when is unique developer in era with 1 level", () => {
          context("when Developer is in era 1 and contract is in era 2", () => {
            beforeEach(async () => {
              await instance.connect(dev1Address).addUserValidation(user1Address, "my justification");
              await instance.connect(dev2Address).addUserValidation(user1Address, "my justification");

              await advanceBlock(validationPoolParams.blocksPerEra + 2);
              await instance.connect(dev1Address).withdraw();
            });

            it("should add developer to era 2", async () => {
              const hunterPools = await instance.hunterPools(dev1Address);

              expect(hunterPools.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await regenerationCredit.balanceOf(dev1Address);

              let tokensBalance = 416666666666666666666666n;

              expect(balanceOf).to.equal(tokensBalance);
            });
          });
        });

        context("when has two devs in the era", () => {
          context("with same levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await addInvitation(owner, user2Address, userTypes.Developer, owner);
                await addDeveloper("Developer D", user2Address);

                await instance.connect(dev1Address).addUserValidation(user1Address, "my justification");
                await instance.connect(dev2Address).addUserValidation(user1Address, "my justification");

                await advanceBlock(10);

                await instance.connect(dev2Address).addUserValidation(user2Address, "my justification");
                await instance.connect(dev1Address).addUserValidation(user2Address, "my justification");

                await advanceBlock(validationPoolParams.blocksPerEra + 2);
                await instance.connect(dev1Address).withdraw();
                await instance.connect(dev2Address).withdraw();
              });

              it("should add developer1 to era 2", async () => {
                const hunterPools = await instance.hunterPools(dev1Address);

                expect(hunterPools.currentEra).to.equal(2);
              });

              it("should add developer2 to era 2", async () => {
                const hunterPools = await instance.hunterPools(dev1Address);

                expect(hunterPools.currentEra).to.equal(2);
              });

              it("developer1 balance must be 208333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(dev1Address);

                let tokensPerEra = 208333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("developer2 balance must be 208333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(dev2Address);

                let tokensPerEra = 208333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addUserValidation(user1Address, "my justification");
            await advanceBlock(validationPoolParams.blocksPerEra + 2);
            await instance.connect(dev1Address).withdraw();
          });

          it("should return error message", async () => {
            await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith(
              "Not eligible to withdraw for this era"
            );
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Developer, owner);
            await addDeveloper("Developer C", user2Address);

            await instance.connect(dev1Address).addUserValidation(user1Address, "my justification");
            await instance.connect(dev2Address).addUserValidation(user1Address, "my justification");
            await advanceBlock(validationPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).addUserValidation(user2Address, "my justification");
            await instance.connect(dev2Address).addUserValidation(user2Address, "my justification");
            await advanceBlock(validationPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).withdraw();
            await instance.connect(dev1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await regenerationCredit.balanceOf(dev1Address);
            let balance = 833333333333333333333332n;

            expect(balanceOf).to.equal(balance);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Not eligible to withdraw");
        });
      });
    });

    context("when is not developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Pool only to voters");
      });
    });
  });

  describe("#exchangePointsForLevel", () => {
    beforeEach(async () => {
      const POINTS_PER_LEVEL = 30;

      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user3Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user4Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user5Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user6Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user7Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user8Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user9Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user10Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user11Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user12Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user13Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user14Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user15Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user16Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user17Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user18Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user19Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user20Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user21Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user22Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user23Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user24Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user25Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user26Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user27Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user28Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user29Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user30Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user31Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user32Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user33Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user34Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user35Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user36Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user37Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user38Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user39Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user40Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user41Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user42Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user43Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user44Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user45Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user46Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user47Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user48Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user49Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user50Address, userTypes.Regenerator, owner);

      await addRegenerator("Regenerator", user1Address);
      await addRegenerator("Regenerator", user2Address);
      await addRegenerator("Regenerator", user3Address);
      await addRegenerator("Regenerator", user4Address);
      await addRegenerator("Regenerator", user5Address);
      await addRegenerator("Regenerator", user6Address);
      await addRegenerator("Regenerator", user7Address);
      await addRegenerator("Regenerator", user8Address);
      await addRegenerator("Regenerator", user9Address);
      await addRegenerator("Regenerator", user10Address);
      await addRegenerator("Regenerator", user11Address);
      await addRegenerator("Regenerator", user12Address);
      await addRegenerator("Regenerator", user13Address);
      await addRegenerator("Regenerator", user14Address);
      await addRegenerator("Regenerator", user15Address);
      await addRegenerator("Regenerator", user16Address);
      await addRegenerator("Regenerator", user17Address);
      await addRegenerator("Regenerator", user18Address);
      await addRegenerator("Regenerator", user19Address);
      await addRegenerator("Regenerator", user20Address);
      await addRegenerator("Regenerator", user21Address);
      await addRegenerator("Regenerator", user22Address);
      await addRegenerator("Regenerator", user23Address);
      await addRegenerator("Regenerator", user24Address);
      await addRegenerator("Regenerator", user25Address);
      await addRegenerator("Regenerator", user26Address);
      await addRegenerator("Regenerator", user27Address);
      await addRegenerator("Regenerator", user28Address);
      await addRegenerator("Regenerator", user29Address);
      await addRegenerator("Regenerator", user30Address);
      await addRegenerator("Regenerator", user31Address);
      await addRegenerator("Regenerator", user32Address);
      await addRegenerator("Regenerator", user33Address);
      await addRegenerator("Regenerator", user34Address);
      await addRegenerator("Regenerator", user35Address);
      await addRegenerator("Regenerator", user36Address);
      await addRegenerator("Regenerator", user37Address);
      await addRegenerator("Regenerator", user38Address);
      await addRegenerator("Regenerator", user39Address);
      await addRegenerator("Regenerator", user40Address);
      await addRegenerator("Regenerator", user41Address);
      await addRegenerator("Regenerator", user42Address);
      await addRegenerator("Regenerator", user43Address);
      await addRegenerator("Regenerator", user44Address);
      await addRegenerator("Regenerator", user45Address);
      await addRegenerator("Regenerator", user46Address);
      await addRegenerator("Regenerator", user47Address);
      await addRegenerator("Regenerator", user48Address);
      await addRegenerator("Regenerator", user49Address);
      await addRegenerator("Regenerator", user50Address);

      await addInvitation(owner, dev1Address, userTypes.Developer, owner);
      await addDeveloper("Developer A", dev1Address);
    });

    context("when the user is not a registered voter", () => {
      it("should revert the transaction", async () => {
        await expect(instance.connect(owner).exchangePointsForLevel()).to.be.revertedWith("Pool only to voters");
      });
    });

    context("when the voter has insufficient points", () => {
      it("should revert the transaction", async () => {
        await expect(instance.connect(dev1Address).exchangePointsForLevel()).to.be.revertedWith("Not enough points");
      });
    });

    context("when the voter has enough points", () => {
      beforeEach(async () => {
        const timeBetweenVotes = 10;

        await instance.connect(dev1Address).addUserValidation(user1Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user2Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user3Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user4Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user5Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user6Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user7Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user8Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user9Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user10Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user11Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user12Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user13Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user14Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user15Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user16Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user17Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user18Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user19Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user20Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user21Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user22Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user23Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user24Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user25Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user26Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user27Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user28Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user29Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user30Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user31Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user32Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user33Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user34Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user35Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user36Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user37Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user38Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user39Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user40Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user41Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user42Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user43Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user44Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user45Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user46Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user47Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user48Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user49Address, "my justification");
        await advanceBlock(timeBetweenVotes);
        await instance.connect(dev1Address).addUserValidation(user50Address, "my justification");
        await advanceBlock(timeBetweenVotes);
      });

      it("should have accumulated the correct number of points before exchange", async () => {
        const userPoints = await instance.validationPoints(dev1Address);
        expect(userPoints).to.equal(50);
      });

      it("should successfully exchange points for one level", async () => {
        await instance.connect(dev1Address).exchangePointsForLevel();

        const level = await validationPool.eraLevels(5, dev1Address);

        expect(level).to.equal(1);
      });

      it("should decrease the voter's points balance by the exact amount", async () => {
        await instance.connect(dev1Address).exchangePointsForLevel();

        const userPoints = await instance.validationPoints(dev1Address);
        expect(userPoints).to.equal(0);
      });

      it("should increment the voter's totalValidationLevels by one", async () => {
        await instance.connect(dev1Address).exchangePointsForLevel();

        const totalLevels = await instance.totalValidationLevels(dev1Address);
        expect(totalLevels).to.equal(1);
      });
    });
  });
});
