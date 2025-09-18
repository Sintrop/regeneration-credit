const { expect } = require("chai");
const { userTypes } = require("./shared/user_types");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("VoteRules", () => {
  let instance, activistRules, communityRules, developerRules, researcherRules, contributorRules;
  let communityRulesMock, activistRulesMock, contributorRulesMock, developerRulesMock, researcherRulesMock;
  let owner, user1Address;

  const activistMockLevels = (levels) => {
    return {
      id: 1,
      activistWallet: ZERO_ADDRESS,
      name: "AAA",
      proofPhoto: "AAAA",
      createdAt: 123,
      pool: { level: levels, currentEra: 1 },
    };
  };

  const contributorMockLevels = (levels) => {
    return {
      id: 1,
      contributorWallet: ZERO_ADDRESS,
      name: "AAA",
      proofPhoto: "AAAA",
      createdAt: 123,
      pool: { level: levels, currentEra: 1 },
      totalContributions: 1,
      lastPublishedAt: 123,
    };
  };

  const developerMockLevels = (levels) => {
    return {
      id: 1,
      developerWallet: ZERO_ADDRESS,
      name: "AAA",
      proofPhoto: "AAAA",
      createdAt: 123,
      pool: { level: levels, currentEra: 1 },
      totalReports: 1,
      lastPublishedAt: 123,
    };
  };

  const researcherMockLevels = (levels) => {
    return {
      id: 1,
      researcherWallet: ZERO_ADDRESS,
      name: "AAA",
      proofPhoto: "AAAA",
      publishedItems: 10,
      publishedResearches: 123,
      lastCalculatorItemAt: 123,
      pool: { level: levels, currentEra: 1 },
      totalReports: 1,
      lastPublishedAt: 123,
      createdAt: 123,
      canPublishMethod: true,
    };
  };

  beforeEach(async () => {
    [owner, user1Address] = await ethers.getSigners();
  });

  describe("#canVote", () => {
    context("when is a voter", () => {
      beforeEach(async () => {
        communityRulesMock = await hre.artifacts.readArtifact("CommunityRules");
        activistRulesMock = await hre.artifacts.readArtifact("ActivistRules");
        contributorRulesMock = await hre.artifacts.readArtifact("ContributorRules");
        developerRulesMock = await hre.artifacts.readArtifact("DeveloperRules");
        researcherRulesMock = await hre.artifacts.readArtifact("ResearcherRules");

        let { _, abi: communityRulesAbi } = communityRulesMock;
        let { __, abi: activistRulesAbi } = activistRulesMock;
        let { ___, abi: contributorAbi } = contributorRulesMock;
        let { ____, abi: developerRulesAbi } = developerRulesMock;
        let { _____, abi: researcherRulesAbi } = researcherRulesMock;

        communityRules = await deployMockContract(owner, communityRulesAbi);
        activistRules = await deployMockContract(owner, activistRulesAbi);
        contributorRules = await deployMockContract(owner, contributorAbi);
        developerRules = await deployMockContract(owner, developerRulesAbi);
        researcherRules = await deployMockContract(owner, researcherRulesAbi);

        const voteRulesFactory = await ethers.getContractFactory("VoteRules");
        instance = await voteRulesFactory.deploy(
          communityRules.target,
          contributorRules.target,
          developerRules.target,
          researcherRules.target
        );

        await communityRules.mock.isVoter.returns(true);
      });

      context("with contributor", () => {
        beforeEach(async () => {
          await communityRules.mock.getUser.returns(userTypes.Contributor);
        });

        context("when totalLevels is 4, totalUsers is 4 and userLevels is 1", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(4);
            await communityRules.mock.userTypesCount.returns(4);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(1));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 10, totalUsers is 10 and userLevels is 1", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(10);
            await communityRules.mock.userTypesCount.returns(10);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 1", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 3", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(3));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 6000, totalUsers is 600 and userLevels is 50", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(6000);
            await communityRules.mock.userTypesCount.returns(600);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(50));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 0, totalUsers is 10 and userLevels is 0", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(0);
            await communityRules.mock.userTypesCount.returns(10);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(0));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 10", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(10));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 20", () => {
          beforeEach(async () => {
            await contributorRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await contributorRules.mock.getContributor.returns(contributorMockLevels(20));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });
      });

      context("with developer", () => {
        beforeEach(async () => {
          await communityRules.mock.getUser.returns(userTypes.Developer);
        });

        context("when totalLevels is 4, totalUsers is 4 and userLevels is 1", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(4);
            await communityRules.mock.userTypesCount.returns(4);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(1));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 10, totalUsers is 10 and userLevels is 1", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(10);
            await communityRules.mock.userTypesCount.returns(10);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 1", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 3", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(3));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 6000, totalUsers is 600 and userLevels is 50", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(6000);
            await communityRules.mock.userTypesCount.returns(600);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(50));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 0, totalUsers is 10 and userLevels is 0", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(0);
            await communityRules.mock.userTypesCount.returns(10);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(0));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 10", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(10));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 20", () => {
          beforeEach(async () => {
            await developerRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await developerRules.mock.getDeveloper.returns(developerMockLevels(20));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });
      });

      context("with researcher", () => {
        beforeEach(async () => {
          await communityRules.mock.getUser.returns(userTypes.Researcher);
        });

        context("when totalLevels is 4, totalUsers is 4 and userLevels is 1", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(4);
            await communityRules.mock.userTypesCount.returns(4);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(1));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 10, totalUsers is 10 and userLevels is 1", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(10);
            await communityRules.mock.userTypesCount.returns(10);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 1", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(1));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 60, totalUsers is 30 and userLevels is 3", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(60);
            await communityRules.mock.userTypesCount.returns(30);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(3));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 6000, totalUsers is 600 and userLevels is 50", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(6000);
            await communityRules.mock.userTypesCount.returns(600);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(50));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });

        context("when totalLevels is 0, totalUsers is 10 and userLevels is 0", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(0);
            await communityRules.mock.userTypesCount.returns(10);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(0));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 10", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(10));
          });

          it("returns false", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(false);
          });
        });

        context("when totalLevels is 50000, totalUsers is 5000 and userLevels is 20", () => {
          beforeEach(async () => {
            await researcherRules.mock.totalActiveLevels.returns(50000);
            await communityRules.mock.userTypesCount.returns(5000);
            await researcherRules.mock.getResearcher.returns(researcherMockLevels(20));
          });

          it("returns true", async () => {
            const canVote = await instance.canVote(user1Address);

            expect(canVote).to.eq(true);
          });
        });
      });
    });

    context("when is not a voter", () => {
      beforeEach(async () => {
        await communityRules.mock.isVoter.returns(false);
      });

      it("should return error message", async () => {
        await expect(instance.canVote(user1Address)).to.be.revertedWith("Not a voter user");
      });
    });
  });

  describe("#totalUserLevels", () => {});

  describe("#totalLevels", () => {});
});
