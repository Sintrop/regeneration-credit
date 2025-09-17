const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

const { advanceBlock } = require("./shared/advance_block");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("DeveloperRules", (accounts) => {
  let instance, communityRules, developerPool, regenerationCredit, validationRules, researcherRules, contributorRules;
  let owner,
    dev1Address,
    dev2Address,
    dev3Address,
    user1Address,
    user2Address,
    user3Address,
    user4Address,
    user5Address,
    user6Address,
    user7Address,
    user8Address,
    user9Address,
    anyAddress;

  let developerPoolParams = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 160,
  };

  const addDeveloper = async (name, from) => {
    await instance.connect(from).addDeveloper(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.setContractCall(from, owner);
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
    await communityRules.setContractCall(instance.target, owner);
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

  const timeBetweenWorks = 10;

  beforeEach(async () => {
    [
      owner,
      dev1Address,
      dev2Address,
      dev3Address,
      user1Address,
      user2Address,
      user3Address,
      user4Address,
      user5Address,
      user6Address,
      user7Address,
      user8Address,
      user9Address,
      anyAddress,
    ] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    instance = validatorRulesDeployed.developerRules;
    validationRules = validatorRulesDeployed.validationRules;
    developerPool = validatorRulesDeployed.developerPool;
    contributorRules = validatorRulesDeployed.contributorRules;
    researcherRules = validatorRulesDeployed.researcherRules;
    activistRules = validatorRulesDeployed.activistRules;
    activistPool = validatorRulesDeployed.activistPool;
    researcherPool = validatorRulesDeployed.researcherPool;

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
    await communityRules.newAllowedCaller(validationRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await developerPool.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(validationRules.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(developerPool.target, "40000000000000000000000000");

    await communityRules.setContractCall(owner, owner);
    await instance.setContractCall(validationRules.target);
    await activistPool.setContractCall(activistRules.target);
    await developerPool.setContractCall(instance);
    await researcherPool.setContractCall(researcherRules.target);

    await addInvitation(owner, dev1Address, userTypes.Developer, owner);
  });

  describe(".fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.id).to.equal("1");
      expect(developer.developerWallet).to.equal(dev1Address.address);
      expect(developer.name).to.equal("Developer A");
      expect(developer.proofPhoto).to.equal("photoURL");
      expect(developer.totalReports).to.equal(0);
      expect(developer.pool.level).to.equal(0);
      expect(developer.pool.currentEra).to.equal(1);
    });
  });

  describe("#addDeveloper", () => {
    context("when is not invited", () => {
      it("should return error message", async () => {
        await expect(addDeveloper("Developer C", dev3Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is invited", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expect(addDeveloper("Developer A", dev1Address)).to.be.revertedWith("User already exists");
        });
      });

      context("when developer does not exist", () => {
        context("when max limit is not reached", () => {
          it("should add developer", async () => {
            await addDeveloper("Developer A", dev1Address);
            const developer = await instance.getDeveloper(dev1Address);

            expect(developer.developerWallet).to.equal(dev1Address.address);
          });

          it("should increment developersCount after create developer", async () => {
            await addDeveloper("Developer A", dev1Address);
            const developersCount = await communityRules.userTypesCount(userTypes.Developer);

            expect(developersCount).to.equal(1);
          });

          it("should add created developer in userType contract as a DEVELOPER", async () => {
            await addDeveloper("Developer A", dev1Address);

            const userType = await communityRules.getUser(dev1Address);
            const DEVELOPER = 4;

            expect(userType).to.equal(DEVELOPER);
          });

          it("should add created developer with initial level equal 0", async () => {
            await addDeveloper("Developer A", dev1Address);

            const developer = await instance.getDeveloper(dev1Address);

            expect(developer.pool.level).to.equal(0);
          });

          it("should add created developer with initial currentEra equal currentContractEra", async () => {
            await addDeveloper("Developer A", dev1Address);

            const developer = await instance.getDeveloper(dev1Address);

            expect(developer.pool.currentEra).to.equal(1);
          });
        });

        context("when max limit is reached", () => {
          beforeEach(async () => {
            const communityRulesMock = await hre.artifacts.readArtifact("CommunityRules");
            let { _, abi: communityRulesAbi } = communityRulesMock;

            communityRules = await deployMockContract(owner, communityRulesAbi);

            const developerRulesContractDependencies = {
              communityRulesAddress: communityRules.target,
              developerPoolAddress: developerPool.target,
              validationRulesAddress: validationRules.target,
              voteRulesAddress: ZERO_ADDRESS,
            };

            await instance.setContractInterfaces(developerRulesContractDependencies);

            await communityRules.mock.userTypesCount.returns(16001);
          });

          it("should return error message", async () => {
            await expect(addDeveloper("Developer A", dev1Address)).to.be.revertedWith("Max user limit");
          });
        });
      });
    });
  });

  describe("addReport", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    context("with developer", () => {
      context("when have not waited time between works", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addReport("description", "report");
        });

        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).addReport("description", "report")).to.be.revertedWith(
            "Can't publish yet"
          );
        });
      });

      context("when have waited time between works", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addReport("description", "report");
        });

        it("should add report", async () => {
          await advanceBlock(timeBetweenWorks * 2);
          await instance.connect(dev1Address).addReport("description", "report");
          const report = await instance.reports(2);
          expect(report.id).to.equal(2);
        });
      });

      context("when don't have report", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addReport("description", "report");
        });

        it("add report", async () => {
          const report = await instance.reports(1);

          expect(report.id).to.equal(1);
          expect(report.era).to.equal(1);
          expect(report.developer).to.equal(dev1Address.address);
          expect(report.report).to.equal("report");
          expect(report.validationsCount).to.equal(0);
          expect(report.valid).to.equal(true);
        });

        it("increment reportsCount", async () => {
          const reportsCount = await instance.reportsCount();

          expect(reportsCount).to.equal(1);
        });

        it("add level to developer", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.level).to.equal(1);
        });

        it("add level to era", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          expect(eraLevels).to.equal(1);
        });
      });

      context("when do not have security blocks to validator analysis", () => {
        beforeEach(async () => {
          await advanceBlock(110);
        });

        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).addReport("description", "report")).to.be.revertedWith(
            "Wait until next era to add report"
          );
        });
      });

      context("when adding report to eras", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addReport("description", "report");

          await advanceBlock(developerPoolParams.blocksPerEra);

          await instance.connect(dev1Address).addReport("description", "report");
        });

        it("eras 1 must have 1 level", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          expect(eraLevels).to.eq(1);
        });

        it("eras 2 must have 1 level", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          expect(eraLevels).to.eq(1);
        });
      });
    });

    context("without developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addReport("description", "report")).to.be.revertedWith("Only Developer");
      });
    });
  });

  describe("#getReport", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
      await instance.connect(dev1Address).addReport("description", "report");
    });

    it("should have fields", async () => {
      const report = await instance.getReport(1);

      expect(report.id).to.equal("1");
      expect(report.era).to.equal("1");
      expect(report.developer).to.equal(dev1Address.address);
      expect(report.report).to.equal("report");
      expect(report.validationsCount).to.equal("0");
      expect(report.valid).to.equal(true);
      expect(report.invalidatedAt).to.equal("0");
    });
  });

  describe("#getReportsIds", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
      await instance.connect(dev1Address).addReport("description", "report");
    });

    it("should have id associated", async () => {
      const userIds = await instance.connect(dev2Address).getReportsIds(dev1Address);

      expect(userIds.length).to.equal(1);
    });
  });

  describe("addReportValidation", () => {
    context("when trying to vote on an already invalidated report", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
        await instance.connect(dev1Address).addReport("description", "report");

        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addDeveloper("User A", user1Address);
        await addDeveloper("User B", user2Address);
        await addDeveloper("User C", user3Address);

        await instance.connect(user1Address).addReportValidation(1, "justification");
        await instance.connect(user2Address).addReportValidation(1, "justification");
      });

      it("should revert because the report is no longer valid", async () => {
        await expect(instance.connect(user3Address).addReportValidation(1, "justification")).to.be.revertedWith(
          "Penalties already applied"
        );
      });
    });

    context("with developer", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addInvitation(owner, user4Address, userTypes.Developer, owner);
        await addInvitation(owner, user5Address, userTypes.Developer, owner);
        await addInvitation(owner, user6Address, userTypes.Developer, owner);
        await addInvitation(owner, user7Address, userTypes.Developer, owner);
        await addInvitation(owner, user8Address, userTypes.Developer, owner);
        await addInvitation(owner, user9Address, userTypes.Developer, owner);

        await addDeveloper("User A", user1Address);
        await addDeveloper("Developer A", dev1Address);
      });

      context("with valid report", () => {
        context("when report must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set one penalty to developer", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("should set reportPenalized to true to prevent double penalties", async () => {
            expect(await instance.reportPenalized(1)).to.be.true;
          });

          it("user type must be DEVELOPER yet", async () => {
            const userType = await communityRules.getUser(dev1Address);

            expect(userType).to.eq(userTypes.Developer);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(contribution.era, dev1Address);

            expect(eraLevels).to.eq(0);
          });

          it("remove developer level report from developerRules", async () => {
            const developer = await instance.getDeveloper(dev1Address);

            expect(developer.pool.level).to.equal(0);
          });

          it("must decrement reportsCount in one", async () => {
            const reportsCount = await instance.reportsCount();

            expect(reportsCount).to.eq(0);
          });
        });

        context("when report must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addDeveloper("User B", user2Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const report = await instance.reports(1);

            expect(report.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const report = await instance.reports(1);

            expect(report.invalidatedAt).to.eq(0);
          });

          it("developer totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("developer pool level is 1", async () => {
            const report = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(report.era, dev1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when developer reach max maxPenalties", () => {
        beforeEach(async () => {
          await addDeveloper("User B", user2Address);
          await addDeveloper("User C", user3Address);
          await addDeveloper("User D", user4Address);
          await addDeveloper("User E", user5Address);
          await addDeveloper("User F", user6Address);
          await addDeveloper("User G", user7Address);
          await addDeveloper("User H", user8Address);
          await addDeveloper("User I", user9Address);

          await instance.connect(user1Address).addReport("description", "report");
          await instance.connect(user2Address).addReport("description", "report");
          await instance.connect(user3Address).addReport("description", "report");
          await instance.connect(user4Address).addReport("description", "report");
          await instance.connect(user5Address).addReport("description", "report");
          await instance.connect(user6Address).addReport("description", "report");
          await instance.connect(user7Address).addReport("description", "report");
          await instance.connect(user8Address).addReport("description", "report");
          await instance.connect(user9Address).addReport("description", "report");

          await advanceBlock(10);

          await instance.connect(user1Address).addReport("description", "report");
          await instance.connect(user2Address).addReport("description", "report");
          await instance.connect(user3Address).addReport("description", "report");
          await instance.connect(user4Address).addReport("description", "report");
          await instance.connect(user5Address).addReport("description", "report");

          await advanceBlock(10);

          await instance.connect(user1Address).addReport("description", "report");
          await instance.connect(user2Address).addReport("description", "report");
          await instance.connect(user3Address).addReport("description", "report");
          await instance.connect(user4Address).addReport("description", "report");
          await instance.connect(user5Address).addReport("description", "report");

          await instance.connect(user2Address).addReportValidation(1, "justification");
          await instance.connect(user3Address).addReportValidation(1, "justification");

          await instance.connect(user1Address).addReportValidation(10, "justification");
          await instance.connect(user4Address).addReportValidation(10, "justification");

          await advanceBlock(10);
          await communityRules.setContractCall(owner, validationRules.target);

          await instance.connect(user1Address).addReport("description", "report");

          await instance.connect(user5Address).addReportValidation(15, "justification");
          await instance.connect(user2Address).addReportValidation(15, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(user1Address);

          expect(isDenied).to.eq(true);
        });

        it("should apply a penalty to the developer's inviter", async () => {
          // Check if the inviter's penalty count has been incremented
          const inviterPenalties = await communityRules.inviterPenalties(owner);
          expect(inviterPenalties).to.eq(1);
        });

        it("should remove all pool levels for the denied developer", async () => {
          // The `removePoolLevels(user, true)` function should zero out the levels
          const report = await instance.reports(1);
          const eraLevels = await developerPool.eraLevels(report.era, user1Address);

          expect(eraLevels).to.eq(0);
        });

        it("Remove invalidated report level from developer", async () => {
          const developer = await instance.getDeveloper(user1Address);

          expect(developer.pool.level).to.eq(1);
        });
      });

      context("with invalid report", () => {
        context("when current era is different from report created era", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await advanceBlock(developerPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });

        context("when report is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "Penalties already applied"
            );
          });
        });

        context("when do not wait waitedTimeBetweenVotes", () => {
          beforeEach(async () => {
            await addDeveloper("User B", user2Address);

            await instance.connect(dev1Address).addReport("description", "report");
            await instance.connect(user2Address).addReport("description", "report");

            await addDeveloper("User C", user3Address);

            await instance.connect(user3Address).addReportValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addReportValidation(2, "justification")).to.be.revertedWith(
              "Wait timeBetweenVotes"
            );
          });
        });

        context("when wait waitedTimeBetweenVotes", () => {
          beforeEach(async () => {
            await addDeveloper("User B", user2Address);

            await instance.connect(dev1Address).addReport("description", "report");
            await instance.connect(user2Address).addReport("description", "report");

            await addDeveloper("User C", user3Address);

            await instance.connect(user3Address).addReportValidation(1, "justification");
            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addReportValidation(2, "justification")).not.be.revertedWith(
              "Wait timeBetweenVotes"
            );
          });
        });

        context("when report do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(0, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });
      });
    });

    context("with contributor", () => {
      beforeEach(async () => {
        await addInvitation(owner, anyAddress, userTypes.Developer, owner);
        await addInvitation(owner, user1Address, userTypes.Contributor, owner);
        await addInvitation(owner, user2Address, userTypes.Contributor, owner);
        await addInvitation(owner, user3Address, userTypes.Contributor, owner);
        await addInvitation(owner, user4Address, userTypes.Contributor, owner);
        await addInvitation(owner, user5Address, userTypes.Contributor, owner);
        await addInvitation(owner, user6Address, userTypes.Contributor, owner);
        await addInvitation(owner, user7Address, userTypes.Contributor, owner);
        await addInvitation(owner, user8Address, userTypes.Contributor, owner);
        await addInvitation(owner, user9Address, userTypes.Contributor, owner);

        await addContributor("User A", user1Address);
        await addDeveloper("User", anyAddress);
      });

      context("with valid report", () => {
        context("when report must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(anyAddress).addReport("description", "report");

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to contributor", async () => {
            const totalPenalties = await instance.totalPenalties(anyAddress);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be DEVELOPER yet", async () => {
            const userType = await communityRules.getUser(anyAddress);

            expect(userType).to.eq(userTypes.Developer);
          });

          it("user type must be DEVELOPER yet", async () => {
            const isDenied = await communityRules.isDenied(anyAddress);

            expect(isDenied).to.eq(false);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(contribution.era, anyAddress);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement reportsCount in one", async () => {
            const reportsCount = await instance.reportsCount();

            expect(reportsCount).to.eq(0);
          });
        });

        context("when report must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(anyAddress).addReport("description", "report");

            await addContributor("User B", user2Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const report = await instance.reports(1);

            expect(report.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const report = await instance.reports(1);

            expect(report.invalidatedAt).to.eq(0);
          });

          it("contributor totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(anyAddress);

            expect(totalPenalties).to.eq(0);
          });

          it("contributor pool level is 1", async () => {
            const report = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(report.era, anyAddress);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when developer reach maxPenalties", () => {
        beforeEach(async () => {
          await addContributor("User B", user2Address);
          await addContributor("User C", user3Address);

          await instance.connect(anyAddress).addReport("description", "report");
          await instance.connect(user1Address).addReportValidation(1, "justification");
          await instance.connect(user2Address).addReportValidation(1, "justification");

          await advanceBlock(10);

          await instance.connect(anyAddress).addReport("description", "report");
          await instance.connect(user1Address).addReportValidation(2, "justification");
          await instance.connect(user3Address).addReportValidation(2, "justification");

          await advanceBlock(10);
          await communityRules.setContractCall(owner, validationRules.target);

          await instance.connect(anyAddress).addReport("description", "report");
          await instance.connect(user1Address).addReportValidation(3, "justification");
          await instance.connect(user2Address).addReportValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(anyAddress);

          expect(isDenied).to.eq(true);
        });
      });

      context("with invalid report", () => {
        context("when current era is different from report created era", () => {
          beforeEach(async () => {
            await instance.connect(anyAddress).addReport("description", "report");

            await advanceBlock(developerPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });

        context("when report is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(anyAddress).addReport("description", "report");

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "Penalties already applied"
            );
          });
        });

        context("when report do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(0, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });
      });
    });

    context("with researcher", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Researcher, owner);
        await addInvitation(owner, user2Address, userTypes.Researcher, owner);
        await addInvitation(owner, user3Address, userTypes.Researcher, owner);
        await addInvitation(owner, user4Address, userTypes.Researcher, owner);
        await addInvitation(owner, user5Address, userTypes.Researcher, owner);
        await addInvitation(owner, user6Address, userTypes.Researcher, owner);
        await addInvitation(owner, user7Address, userTypes.Researcher, owner);
        await addInvitation(owner, user8Address, userTypes.Researcher, owner);
        await addInvitation(owner, user9Address, userTypes.Researcher, owner);

        await addResearcher("User A", user1Address);
        await addDeveloper("User", dev1Address);
      });

      context("with valid report", () => {
        context("when report must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.reports(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to developer", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be DEVELOPER yet", async () => {
            const userType = await communityRules.getUser(dev1Address);

            expect(userType).to.eq(userTypes.Developer);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(contribution.era, dev1Address);

            expect(eraLevels).to.eq(0);
          });

          it("do not must decrement reportsTotalCount", async () => {
            const reportsTotalCount = await instance.reportsTotalCount();

            expect(reportsTotalCount).to.eq(1);
          });

          it("must decrement reportsCount in one", async () => {
            const reportsCount = await instance.reportsCount();

            expect(reportsCount).to.eq(0);
          });
        });

        context("when report must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addResearcher("User B", user2Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const report = await instance.reports(1);

            expect(report.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const report = await instance.reports(1);

            expect(report.invalidatedAt).to.eq(0);
          });

          it("contributor totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("contributor pool level is 1", async () => {
            const report = await instance.reports(1);
            const eraLevels = await developerPool.eraLevels(report.era, dev1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when developer reach max maxPenalties", () => {
        beforeEach(async () => {
          await addResearcher("User B", user2Address);
          await addResearcher("User C", user3Address);
          await addResearcher("User D", user4Address);
          await addResearcher("User E", user5Address);
          await addResearcher("User F", user6Address);
          await addResearcher("User G", user7Address);
          await addResearcher("User H", user8Address);
          await addResearcher("User I", user9Address);

          await instance.connect(dev1Address).addReport("description", "report");

          await advanceBlock(10);

          await instance.connect(dev1Address).addReport("description", "report");

          await advanceBlock(10);

          await instance.connect(dev1Address).addReport("description", "report");

          await researcherRules.connect(user1Address).addResearch("description", "report", "file");
          await researcherRules.connect(user2Address).addResearch("description", "report", "file");
          await researcherRules.connect(user3Address).addResearch("description", "report", "file");
          await researcherRules.connect(user4Address).addResearch("description", "report", "file");
          await researcherRules.connect(user5Address).addResearch("description", "report", "file");
          await researcherRules.connect(user6Address).addResearch("description", "report", "file");
          await researcherRules.connect(user7Address).addResearch("description", "report", "file");
          await researcherRules.connect(user8Address).addResearch("description", "report", "file");
          await researcherRules.connect(user9Address).addResearch("description", "report", "file");

          await advanceBlock(10);

          await researcherRules.connect(user1Address).addResearch("description", "report", "file");
          await researcherRules.connect(user2Address).addResearch("description", "report", "file");
          await researcherRules.connect(user3Address).addResearch("description", "report", "file");
          await researcherRules.connect(user4Address).addResearch("description", "report", "file");
          await researcherRules.connect(user5Address).addResearch("description", "report", "file");

          await advanceBlock(10);

          await researcherRules.connect(user1Address).addResearch("description", "report", "file");
          await researcherRules.connect(user2Address).addResearch("description", "report", "file");
          await researcherRules.connect(user3Address).addResearch("description", "report", "file");
          await researcherRules.connect(user4Address).addResearch("description", "report", "file");
          await researcherRules.connect(user5Address).addResearch("description", "report", "file");

          await instance.connect(user2Address).addReportValidation(1, "justification");
          await instance.connect(user3Address).addReportValidation(1, "justification");

          await instance.connect(user1Address).addReportValidation(2, "justification");
          await instance.connect(user4Address).addReportValidation(2, "justification");

          await advanceBlock(10);
          await communityRules.setContractCall(owner, validationRules.target);

          await instance.connect(user5Address).addReportValidation(3, "justification");
          await instance.connect(user2Address).addReportValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const isDenied = await communityRules.isDenied(dev1Address);

          expect(isDenied).to.eq(true);
        });
      });

      context("with invalid report", () => {
        context("when current era is different from report created era", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await advanceBlock(developerPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });

        context("when report is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addReportValidation(1, "justification");
            await instance.connect(user2Address).addReportValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(user3Address).addReportValidation(1, "justification")).to.be.revertedWith(
              "Penalties already applied"
            );
          });
        });

        context("when report do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addReportValidation(0, "justification")).to.be.revertedWith(
              "This report is not VALID"
            );
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addReportValidation(1, "justification")).to.be.revertedWith(
          "Not a voter user"
        );
      });
    });
  });

  describe("#getDeveloper", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.developerWallet).to.equal(dev1Address.address);
    });
  });

  describe("#withdraw", () => {
    context("when is developer", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      context("when can withdraw tokens", () => {
        context("when is unique developer in era with 1 level", () => {
          context("when Developer is in era 1 and contract is in era 2", () => {
            beforeEach(async () => {
              await instance.connect(dev1Address).addReport("description", "report");

              await advanceBlock(developerPoolParams.blocksPerEra + 2);
              await instance.connect(dev1Address).withdraw();
            });

            it("should add developer to era 2", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              expect(developer.pool.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await regenerationCredit.balanceOf(dev1Address);

              let tokensBalance = 1666666666666666666666666n;

              expect(balanceOf).to.equal(tokensBalance);
            });
          });
        });

        context("when has two devs in the era", () => {
          beforeEach(async () => {
            await addInvitation(owner, dev2Address, userTypes.Developer, owner);
            await addDeveloper("Developer B", dev2Address);
          });

          context("with same levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.connect(dev1Address).addReport("description", "report");
                await instance.connect(dev2Address).addReport("description", "report");

                await advanceBlock(developerPoolParams.blocksPerEra + 2);
                await instance.connect(dev1Address).withdraw();
                await instance.connect(dev2Address).withdraw();
              });

              it("should add developer1 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("should add developer2 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("developer1 balance must be 833333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(dev1Address);

                let tokensPerEra = 833333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("developer2 balance must be 833333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(dev2Address);

                let tokensPerEra = 833333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addReport("description", "report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
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
            await instance.connect(dev1Address).addReport("description", "report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).addReport("description", "report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).withdraw();
            await instance.connect(dev1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await regenerationCredit.balanceOf(dev1Address);
            let balance = 3333333333333333333333332n;

            expect(balanceOf).to.equal(balance);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith(
            "Not eligible to withdraw for this era"
          );
        });
      });
    });

    context("when is not developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Pool only to developer");
      });
    });
  });

  describe("#removePoolLevels", () => {
    beforeEach(async () => {
      await addDeveloper("Developer  A", dev1Address);

      await instance.connect(dev1Address).addReport("description", "report");

      await advanceBlock(developerPoolParams.blocksPerEra);

      await instance.connect(dev1Address).addReport("description", "report");

      await instance.setContractCall(owner);
    });

    context("when user is denied", () => {
      beforeEach(async () => {
        await instance.removePoolLevels(dev1Address);
      });

      it("remove user levels from pool", async () => {
        const levelsEra1 = await developerPool.eraLevels(2, dev1Address);

        expect(levelsEra1).to.equal(0);
      });

      it("should not remove user levels from developer local level", async () => {
        const developer = await instance.getDeveloper(dev1Address);

        expect(developer.pool.level).to.equal(2);
      });
    });
  });
});
