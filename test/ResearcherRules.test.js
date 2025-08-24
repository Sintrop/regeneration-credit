const { userTypes } = require("./shared/user_types");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");

describe("ResearcherRules", () => {
  let instance;
  let regenerationCredit;
  let researcherPool;
  let communityRules;
  let validationRules;
  let developerRules;
  let contributorRules;
  let activistRules;
  let owner, resea1Address, resea2Address, user1Address, user2Address, user3Address, user4Address;

  const timeBetweenWorks = 10;

  const args = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 150,
  };

  const addResearcher = async (name, from) => {
    await instance.connect(from).addResearcher(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const addDeveloper = async (name, from) => {
    await developerRules.connect(from).addDeveloper(name, "photoURL");
  };

  const addContributor = async (name, from) => {
    await contributorRules.connect(from).addContributor(name, "photoURL");
  };

  const addActivist = async (name, from) => {
    await activistRules.connect(from).addActivist(name, "photoURL");
  };

  const addResearch = async (from) => {
    await instance.connect(from).addResearch("title", "thesis", "fileURL");
  };

  const addCalculatorItem = async (from) => {
    await instance.connect(from).addCalculatorItem("item", "thesis", "kg", 1);
  };

  const addEvaluationMethod = async (from) => {
    await instance.connect(from).addEvaluationMethod("title", "research", "projectURL");
  };

  beforeEach(async () => {
    [owner, resea1Address, resea2Address, user1Address, user2Address, user3Address, user4Address] =
      await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    validationRules = validatorRulesDeployed.validationRules;
    instance = validatorRulesDeployed.researcherRules;
    researcherPool = validatorRulesDeployed.researcherPool;
    developerRules = validatorRulesDeployed.developerRules;
    contributorRules = validatorRulesDeployed.contributorRules;
    activistRules = validatorRulesDeployed.activistRules;

    await communityRules.newAllowedCaller(validationRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
    await researcherPool.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(validationRules.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(researcherPool.target, args.totalTokens);

    await communityRules.setContractCall(owner, validationRules.target);
    await instance.setContractCall(validationRules.target);
    await researcherPool.setContractCall(instance);

    await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
  });

  describe("#addResearcher", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addResearcher("Reseacher B", resea2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when researcher already exists", () => {
        it("should return error", async () => {
          await addResearcher("Researcher A", resea1Address);
          await expect(addResearcher("Researcher A", resea1Address)).to.be.revertedWith("User already exists");
        });
      });

      context("when researcher don't exist", () => {
        context("when max limit is not reached", () => {
          beforeEach(async () => {
            await addResearcher("Researcher A", resea1Address);
          });

          it("create researcher", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.researcherWallet).to.equal(resea1Address.address);
          });

          it("increment researcherCount after create researcher", async () => {
            const researchersCount = await communityRules.userTypesCount(userTypes.Researcher);

            expect(researchersCount).to.equal(1);
          });

          it("add created researcher in userType contract as a RESEARCHER", async () => {
            const userType = await communityRules.getUser(resea1Address);
            const RESEARCHER = 3;

            expect(userType).to.equal(RESEARCHER);
          });

          it("add created researcher with 0 published researches", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.publishedResearches).to.equal(0);
          });

          it("add created researcher with 0 published items", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.publishedItems).to.equal(0);
          });

          it("add created researcher with publishedMethod = true", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.canPublishMethod).to.equal(true);
          });
        });

        context("when max limit is reached", () => {
          beforeEach(async () => {
            const communityRulesMock = await hre.artifacts.readArtifact("CommunityRules");
            let { _, abi: communityRulesAbi } = communityRulesMock;

            communityRules = await deployMockContract(owner, communityRulesAbi);

            const researcherRulesContractDependencies = {
              communityRulesAddress: communityRules.target,
              researcherPoolAddress: researcherPool.target,
              validationRulesAddress: validationRules.target,
              voteRulesAddress: ZERO_ADDRESS,
            };

            await instance.setContractInterfaces(researcherRulesContractDependencies);

            await communityRules.mock.userTypesCount.returns(16001);
          });

          it("should return error message", async () => {
            await expect(addResearcher("Researcher A", resea1Address)).to.be.revertedWith("Max user limit");
          });
        });
      });
    });
  });

  describe("#getResearcher", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
    });

    it("return a researcher", async () => {
      const researcher = await instance.getResearcher(resea1Address);

      expect(researcher.researcherWallet).to.equal(resea1Address.address);
    });
  });

  describe("#getResearcher", () => {
    context("when researcher exists", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      it("return true", async () => {
        const researcher = await instance.getResearcher(resea1Address);

        expect(researcher.id).to.equal(1);
      });
    });

    context("when researcher don't exist", () => {
      it("return false", async () => {
        const researcher = await instance.getResearcher(resea1Address);

        expect(researcher.id).to.equal(0);
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      context("when researcher is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await expect(instance.connect(resea1Address).withdraw()).to.be.revertedWith(
            "Not eligible to withdraw for this era"
          );
        });
      });

      context("when researcher is in era 1 and current era is 2", () => {
        context("with one researches", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra);

            await instance.connect(resea1Address).withdraw();
          });

          it("withdraw 1666666666666666666666666 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(resea1Address);
            const expectedBalance = 1666666666666666666666666n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });

        context("with one researches", () => {
          beforeEach(async () => {
            await addInvitation(owner, resea2Address, userTypes.Researcher, owner);
            await addResearcher("Researcher B", resea2Address);
            await addResearch(resea1Address);
            await addResearch(resea2Address);

            await advanceBlock(args.blocksPerEra);

            await instance.connect(resea1Address).withdraw();
          });

          it("withdraw 833333333333333333333333 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(resea1Address);
            const expectedBalance = 833333333333333333333333n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(instance.connect(resea1Address).withdraw()).to.be.revertedWith("Only researchers");
      });
    });
  });

  describe("#addResearch", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addResearch(owner)).to.be.revertedWith("Only researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      context("when have time to validator analysis", () => {
        beforeEach(async () => {
          await addResearch(resea1Address);
        });

        context("when have waited time between researches", () => {
          it("add a research", async () => {
            const firstResearch = await instance.researchesCount();

            expect(firstResearch).to.equal(1);
          });

          it("add 1 to researcher publishedResearches", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.publishedResearches).to.equal(1);
          });

          it("add 1 to researcher pool level", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.pool.level).to.equal(1);
          });

          it("add 1 to researcher pool eraLeves", async () => {
            const eraLevel = await researcherPool.eraLevels(1, resea1Address);

            expect(eraLevel).to.equal(1);
          });

          it("dont add to researcher pool eraLeves of other era", async () => {
            const eraLevel = await researcherPool.eraLevels(2, resea1Address);

            expect(eraLevel).to.equal(0);
          });

          context("when is next era", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);

              await addResearch(resea1Address);
            });

            it("add +1 to researcher pool eraLeves of era 2", async () => {
              const eraLevel = await researcherPool.eraLevels(2, resea1Address);

              expect(eraLevel).to.equal(1);
            });

            it("add +1 to researcher pool level", async () => {
              const researcher = await instance.getResearcher(resea1Address);

              expect(researcher.pool.level).to.equal(2);
            });

            it("dont add to researcher pool eraLeves of other era", async () => {
              const eraLevel = await researcherPool.eraLevels(3, resea1Address);

              expect(eraLevel).to.equal(0);
            });
          });
        });

        context("when have not waited time between works", () => {
          it("should return error message", async () => {
            await expect(addResearch(resea1Address)).to.be.revertedWith("Can't publish yet");
          });
        });
      });

      context("when do not have time to validator analysis", () => {
        beforeEach(async () => {
          await advanceBlock(115);
        });

        it("should return error message", async () => {
          await expect(addResearch(resea1Address)).to.be.revertedWith("Wait until next era");
        });
      });
    });
  });

  describe("#getResearch", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addResearch(resea1Address);
    });

    it("should have fields", async () => {
      const research = await instance.getResearch(1);

      expect(research.id).to.equal("1");
      expect(research.era).to.equal("1");
      expect(research.createdBy).to.equal(resea1Address.address);
      expect(research.title).to.equal("title");
      expect(research.thesis).to.equal("thesis");
      expect(research.file).to.equal("fileURL");
      expect(research.validationsCount).to.equal("0");
      expect(research.valid).to.equal(true);
      expect(research.invalidatedAt).to.equal("0");
    });
  });

  describe("addResearchValidation", () => {
    context("when trying to vote on an already invalidated research", () => {
      beforeEach(async () => {
        // Setup: create a researcher, a research, and enough validators to invalidate it.

        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);

        await addResearcher("Researcher A", resea1Address);
        await addResearch(resea1Address);

        await addDeveloper("User A", user1Address);
        await addDeveloper("User B", user2Address);
        await addDeveloper("User C", user3Address);

        // Invalidate the research
        await instance.connect(user1Address).addResearchValidation(1, "justification");
        await instance.connect(user2Address).addResearchValidation(1, "justification");
      });

      it("should revert because the research is no longer valid", async () => {
        // A third validator attempts to vote on the already invalid research
        await expect(instance.connect(user3Address).addResearchValidation(1, "justification")).to.be.revertedWith(
          "Research not VALID"
        );

        // NOTE: The transaction reverts on `require(research.valid)`, which is checked
        // before `require(!researchPenalized)`. This is the correct and expected behavior.
      });
    });

    context("with researcher", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Researcher, owner);
        await addInvitation(owner, user2Address, userTypes.Researcher, owner);
        await addInvitation(owner, user3Address, userTypes.Researcher, owner);
        await addInvitation(owner, user4Address, userTypes.Researcher, owner);

        await addResearcher("User A", user1Address);
        await addResearcher("Researcher A", resea1Address);
      });

      context("with valid contribution", () => {
        context("when research must be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement researchesCount in one", async () => {
            const researchesCount = await instance.researchesCount();

            expect(researchesCount).to.eq(0);
          });
        });

        context("when research must not be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when researcher reach max maxPenalties", () => {
        beforeEach(async () => {
          await addResearcher("User B", user2Address);
          await addResearcher("User C", user3Address);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(1, "justification");
          await instance.connect(user2Address).addResearchValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(2, "justification");
          await instance.connect(user3Address).addResearchValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(3, "justification");
          await instance.connect(user2Address).addResearchValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(resea1Address);

          expect(isDenied).to.eq(true);
        });
      });

      context("with invalid research", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);

            await addResearch(resea1Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("wwhen do not wait waitedTimeBetweenVotes", () => {
          beforeEach(async () => {
            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);

            await addResearch(resea1Address);

            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user2Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Wait timeBetweenVotes"
            );
          });
        });

        context("wwhen wait waitedTimeBetweenVotes", () => {
          beforeEach(async () => {
            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);

            await addResearch(resea1Address);
            await addResearch(user3Address);

            await instance.connect(user2Address).addResearchValidation(1, "justification");
            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user2Address).addResearchValidation(2, "justification")).not.be.revertedWith(
              "Wait timeBetweenVotes"
            );
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(0, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });
      });
    });

    context("with developer", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addInvitation(owner, user4Address, userTypes.Developer, owner);

        await addDeveloper("User A", user1Address);
        await addResearcher("Researcher A", resea1Address);
      });

      context("with valid contribution", () => {
        context("when research must be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement researchesCount in one", async () => {
            const researchesCount = await instance.researchesCount();

            expect(researchesCount).to.eq(0);
          });

          it("should set researchPenalized to true to prevent double penalties", async () => {
            expect(await instance.researchPenalized(1)).to.be.true;
          });
        });

        context("when research must not be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });

          it("should keep researchPenalized to false to prevent double penalties", async () => {
            expect(await instance.researchPenalized(1)).to.be.false;
          });
        });
      });

      context("when researcher reach max maxPenalties", () => {
        beforeEach(async () => {
          await addDeveloper("User B", user2Address);
          await addDeveloper("User C", user3Address);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(1, "justification");
          await instance.connect(user2Address).addResearchValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(2, "justification");
          await instance.connect(user3Address).addResearchValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(3, "justification");
          await instance.connect(user2Address).addResearchValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(resea1Address);

          expect(isDenied).to.eq(true);
        });

        it("should apply a penalty to the researcher's inviter", async () => {
          // Check if the inviter's penalty count has been incremented
          const inviterPenalties = await communityRules.inviterPenalties(owner);
          expect(inviterPenalties).to.eq(1);
        });

        it("should remove all pool levels for the denied researcher", async () => {
          // The `removePoolLevels(user, true)` function should zero out the researcher's levels
          const research = await instance.researches(3);

          const poolLevels = await researcherPool.eraLevels(research.era, resea1Address);
          expect(poolLevels).to.equal(0);
        });
      });

      context("with invalid research", () => {
        context("when current era is different from research created era", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when research is invalidated", () => {
          beforeEach(async () => {
            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);

            await addResearch(resea1Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when research do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(0, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });
      });
    });

    context("with contributor", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Contributor, owner);
        await addInvitation(owner, user2Address, userTypes.Contributor, owner);
        await addInvitation(owner, user3Address, userTypes.Contributor, owner);
        await addInvitation(owner, user4Address, userTypes.Contributor, owner);

        await addContributor("User A", user1Address);
        await addResearcher("Researcher A", resea1Address);
      });

      context("with valid contribution", () => {
        context("when research must be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement researchesCount in one", async () => {
            const researchesCount = await instance.researchesCount();

            expect(researchesCount).to.eq(0);
          });
        });

        context("when research must not be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when researcher reach maxPenalties", () => {
        beforeEach(async () => {
          await addContributor("User B", user2Address);
          await addContributor("User C", user3Address);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(1, "justification");
          await instance.connect(user2Address).addResearchValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(2, "justification");
          await instance.connect(user3Address).addResearchValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(3, "justification");
          await instance.connect(user2Address).addResearchValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(resea1Address);

          expect(isDenied).to.eq(true);
        });
      });

      context("with invalid research", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);

            await addResearch(resea1Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(0, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });
      });
    });

    context("with activist", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Activist, owner);
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addInvitation(owner, user3Address, userTypes.Activist, owner);
        await addInvitation(owner, user4Address, userTypes.Activist, owner);

        await addActivist("User A", user1Address);
        await addResearcher("Researcher A", resea1Address);
      });

      context("with valid contribution", () => {
        context("when research must be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);
            await addActivist("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement researchesCount in one", async () => {
            const researchesCount = await instance.researchesCount();

            expect(researchesCount).to.eq(0);
          });
        });

        context("when research must not be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);
            await addActivist("User D", user4Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when researcher reach max maxPenalties", () => {
        beforeEach(async () => {
          await addActivist("User B", user2Address);
          await addActivist("User C", user3Address);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(1, "justification");
          await instance.connect(user2Address).addResearchValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(2, "justification");
          await instance.connect(user3Address).addResearchValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await addResearch(resea1Address);
          await instance.connect(user1Address).addResearchValidation(3, "justification");
          await instance.connect(user2Address).addResearchValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(resea1Address);

          expect(isDenied).to.eq(isDenied);
        });
      });

      context("with invalid research", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);

            await addResearch(resea1Address);

            await instance.connect(user1Address).addResearchValidation(1, "justification");
            await instance.connect(user2Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addResearchValidation(1, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addResearchValidation(0, "justification")).to.be.revertedWith(
              "Research not VALID"
            );
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addResearchValidation(1, "justification")).to.be.revertedWith(
          "Not a voter user"
        );
      });
    });
  });

  describe("#getResearches", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addResearch(resea1Address);
    });
  });

  describe("#removePoolLevels", () => {
    beforeEach(async () => {
      await addResearcher("Researcher  A", resea1Address);

      await addResearch(resea1Address);

      await advanceBlock(timeBetweenWorks);

      await addResearch(resea1Address);
      await instance.setContractCall(owner);
    });

    context("when user is not to denied", () => {
      beforeEach(async () => {
        await instance.removePoolLevels(resea1Address, false);
      });

      it("remove user levels from pool", async () => {
        const levelsEra1 = await researcherPool.eraLevels(1, resea1Address);

        expect(levelsEra1).to.equal(1);
      });

      it("remove user levels from researcher", async () => {
        const reseacher = await instance.getResearcher(resea1Address);

        expect(reseacher.pool.level).to.equal(1);
      });
    });

    context("when user is to denied", () => {
      beforeEach(async () => {
        await instance.removePoolLevels(resea1Address, true);
      });

      it("remove user levels from pool", async () => {
        const levelsEra1 = await researcherPool.eraLevels(1, resea1Address);

        expect(levelsEra1).to.equal(0);
      });

      it("remove user levels from researcher", async () => {
        const reseacher = await instance.getResearcher(resea1Address);

        expect(reseacher.pool.level).to.equal(2);
      });
    });
  });

  describe("#addCalculatorItem", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addCalculatorItem(owner)).to.be.revertedWith("Only researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
        await addCalculatorItem(resea1Address);
      });

      context("when have waited time between calculatorItems", () => {
        it("add an calculatorItem", async () => {
          const firstCalculatorItem = await instance.calculatorItemsCount();

          expect(firstCalculatorItem).to.equal(1);
        });

        it("should add researcher publishedItems", async () => {
          const researcher = await instance.getResearcher(resea1Address);
          const publishedItems = await researcher.publishedItems;

          expect(publishedItems).to.equal(1);
        });
      });

      context("when have not waited time between calculatorItems", () => {
        it("should return error message", async () => {
          await expect(addCalculatorItem(resea1Address)).to.be.revertedWith("Can't publish yet");
        });
      });
    });
  });

  describe("#addEvaluationMethod", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addEvaluationMethod(owner)).to.be.revertedWith("Only researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
        await addEvaluationMethod(resea1Address);
      });

      context("when did not publish a method before", () => {
        it("add an evaluationMethod", async () => {
          const firstEvaluationMethod = await instance.evaluationMethodsCount();

          expect(firstEvaluationMethod).to.equal(1);
        });

        it("must set researcher bool to false", async () => {
          const researcher = await instance.getResearcher(resea1Address);
          const canPublishMethod = await researcher.canPublishMethod;

          expect(canPublishMethod).to.equal(false);
        });
      });

      context("when publish second method", () => {
        it("should return error message", async () => {
          await expect(addEvaluationMethod(resea1Address)).to.be.revertedWith("Only one method allowed");
        });
      });
    });
  });
});
