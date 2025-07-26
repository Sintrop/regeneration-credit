const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

const { advanceBlock } = require("./shared/advance_block");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("ContributorRules", (accounts) => {
  let instance;
  let communityRules;
  let contributorPool;
  let regenerationCredit;
  let validationRules;
  let researcherRules;
  let developerRules;
  let owner,
    contr1Address,
    contr2Address,
    contr3Address,
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

  let contributorPoolParams = {
    totalTokens: "7500000000000000000000000",
    halving: 12,
    blocksPerEra: 150,
  };

  const timeBetweenWorks = 10;

  const addContributor = async (name, from) => {
    await instance.connect(from).addContributor(name, "photoURL");
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
  };

  const addDeveloper = async (name, from) => {
    await developerRules.connect(from).addDeveloper(name, "photoURL");
  };

  const addActivist = async (name, from) => {
    await activistRules.connect(from).addActivist(name, "photoURL");
  };

  const addContribution = async (from) => {
    await instance.connect(from).addContribution("title", "thesis");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.setContractCall(owner);
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
    await communityRules.setContractCall(instance.target);
  };

  beforeEach(async () => {
    [
      owner,
      contr1Address,
      contr2Address,
      contr3Address,
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
    instance = validatorRulesDeployed.contributorRules;
    validationRules = validatorRulesDeployed.validationRules;
    contributorPool = validatorRulesDeployed.contributorPool;
    developerRules = validatorRulesDeployed.developerRules;
    researcherRules = validatorRulesDeployed.researcherRules;
    activistRules = validatorRulesDeployed.activistRules;

    await validationRules.setContractCall(owner, instance.target, owner, owner);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
    await communityRules.newAllowedCaller(validationRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await contributorPool.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(instance.target);
    await validationRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(validationRules.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(contributorPool.target, "40000000000000000000000000");

    await addInvitation(owner, contr1Address, userTypes.Contributor, owner);
  });

  describe(".fields", () => {
    it("should have fields", async () => {
      await addContributor("Contributor A", contr1Address);
      const contributor = await instance.getContributor(contr1Address);

      expect(contributor.id).to.equal("1");
      expect(contributor.contributorWallet).to.equal(contr1Address.address);
      expect(contributor.name).to.equal("Contributor A");
      expect(contributor.proofPhoto).to.equal("photoURL");

      expect(contributor.pool.level).to.equal(0);
      expect(contributor.pool.currentEra).to.equal(1);
    });
  });

  describe("#addContributor", () => {
    context("when is not invited", () => {
      it("should return error message", async () => {
        await expect(addContributor("Contributor C", contr3Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is invited", () => {
      context("when contributor exists", () => {
        it("should return error message", async () => {
          await addContributor("Contributor A", contr1Address);

          await expect(addContributor("Contributor A", contr1Address)).to.be.revertedWith("User already exists");
        });
      });

      context("when contributor does not exist", () => {
        context("when max limit is not reached", () => {
          it("should add contributor", async () => {
            await addContributor("Contributor A", contr1Address);
            const contributor = await instance.getContributor(contr1Address);

            expect(contributor.contributorWallet).to.equal(contr1Address.address);
          });

          it("should increment contributorsCount after create contributor", async () => {
            await addContributor("Contributor A", contr1Address);
            const contributorsCount = await communityRules.userTypesCount(userTypes.Contributor);

            expect(contributorsCount).to.equal(1);
          });

          it("should add created contributor in userType contract as a CONTRIBUTOR", async () => {
            await addContributor("Contributor A", contr1Address);

            const userType = await communityRules.getUser(contr1Address);
            const CONTRIBUTOR = 5;

            expect(userType).to.equal(CONTRIBUTOR);
          });

          it("should add created contributor with initial level equal 0", async () => {
            await addContributor("Contributor A", contr1Address);

            const contributor = await instance.getContributor(contr1Address);

            expect(contributor.pool.level).to.equal(0);
          });

          it("should add created contributor with initial currentEra equal currentContractEra", async () => {
            await addContributor("Contributor A", contr1Address);

            const contributor = await instance.getContributor(contr1Address);

            expect(contributor.pool.currentEra).to.equal(1);
          });
        });

        context("when max limit is reached", () => {
          beforeEach(async () => {
            const communityRulesMock = await hre.artifacts.readArtifact("CommunityRules");
            let { _, abi: communityRulesAbi } = communityRulesMock;

            communityRules = await deployMockContract(owner, communityRulesAbi);

            const contributorRulesContractDependencies = {
              communityRulesAddress: communityRules.target,
              contributorPoolAddress: contributorPool.target,
              validationRulesAddress: validationRules.target,
              voteRulesAddress: ZERO_ADDRESS,
            };

            await instance.setContractAddressDependencies(contributorRulesContractDependencies);

            await communityRules.mock.userTypesCount.returns(16001);
          });

          it("should return error message", async () => {
            await expect(addContributor("Contributor A", contr1Address)).to.be.revertedWith("Max user limit");
          });
        });
      });
    });
  });

  describe("addContribution", () => {
    beforeEach(async () => {
      await addContributor("Contributor A", contr1Address);
    });

    context("with contributor", () => {
      context("when have time to validator analysis", () => {
        context("when have not waited timeBetweenWorks", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(contr1Address).addContribution("description", "contribution")
            ).to.be.revertedWith("Can't publish yet");
          });
        });

        context("when have waited timeBetweenWorks", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");
          });

          it("should add contribution", async () => {
            await advanceBlock(timeBetweenWorks);
            await instance.connect(contr1Address).addContribution("description", "contribution");
            const contribution = await instance.contributions(2);
            expect(contribution.id).to.equal(2);
          });
        });

        context("when don't have contribution", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");
          });

          it("add contribution id", async () => {
            const contribution = await instance.contributions(1, contr1Address);

            expect(contribution.id).to.equal(1);
          });

          it("add contribution user", async () => {
            const contribution = await instance.contributions(1, contr1Address);

            expect(contribution.user).to.equal(contr1Address);
          });

          it("add level to contributor", async () => {
            const contributor = await instance.getContributor(contr1Address);

            expect(contributor.pool.level).to.equal(1);
          });

          it("add level to era", async () => {
            const eraLevels = await contributorPool.eraLevels(1, contr1Address);

            expect(eraLevels).to.equal(1);
          });

          it("add user to contribution", async () => {
            const contribution = await instance.contributions(1, contr1Address);

            expect(contribution.user).to.equal(contr1Address.address);
          });

          it("increment contributiosCount", async () => {
            const contributionsCount = await instance.contributionsCount();

            expect(contributionsCount).to.equal(1);
          });

          context("when adding contribution to eras", () => {
            beforeEach(async () => {
              await advanceBlock(contributorPoolParams.blocksPerEra);

              await instance.connect(contr1Address).addContribution("description", "contribution");
            });

            it("eras 1 must have 1 level", async () => {
              const eraLevels = await contributorPool.eraLevels(1, contr1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eras 2 must have 1 level", async () => {
              const eraLevels = await contributorPool.eraLevels(2, contr1Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });
      });

      context("when do not have time to validator analysis", () => {
        beforeEach(async () => {
          await advanceBlock(115);
        });

        it("should return error message", async () => {
          await expect(
            instance.connect(contr1Address).addContribution("description", "contribution")
          ).to.be.revertedWith("Wait until next era to add contribution");
        });
      });
    });

    context("without contributor", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContribution("description", "contribution")).to.be.revertedWith(
          "Only Contributor"
        );
      });
    });
  });

  describe("#getContribution", () => {
    beforeEach(async () => {
      await addContributor("Contributor A", contr1Address);
      await instance.connect(contr1Address).addContribution("description", "contribution");
    });

    it("should have fields", async () => {
      const contribution = await instance.getContribution(1);

      expect(contribution.id).to.equal("1");
      expect(contribution.era).to.equal("1");
      expect(contribution.user).to.equal(contr1Address.address);
      expect(contribution.report).to.equal("contribution");
    });
  });

  describe("#getContributionsIds", () => {
    beforeEach(async () => {
      await addContributor("Contributor A", contr1Address);
      await instance.connect(contr1Address).addContribution("description", "contribution");
    });

    it("should have id associated", async () => {
      const userIds = await instance.connect(contr2Address).getContributionsIds(contr1Address);

      expect(userIds.length).to.equal(1);
    });
  });

  describe("#getContributor", () => {
    it("should return a contributor", async () => {
      await addContributor("Contributor A", contr1Address);

      const contributor = await instance.getContributor(contr1Address);

      expect(contributor.contributorWallet).to.equal(contr1Address.address);
    });
  });

  describe("#withdraw", () => {
    context("when is contributor", () => {
      beforeEach(async () => {
        await addContributor("Contributor A", contr1Address);
      });

      context("when can withdraw tokens", () => {
        context("when is unique contributor in era with 1 level", () => {
          context("when Contributor is in era 1 and contract is in era 2", () => {
            beforeEach(async () => {
              await instance.connect(contr1Address).addContribution("description", "contribution");

              await advanceBlock(contributorPoolParams.blocksPerEra + 2);
              await instance.connect(contr1Address).withdraw();
            });

            it("should add contributor to era 2", async () => {
              const contributor = await instance.getContributor(contr1Address);

              expect(contributor.pool.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await regenerationCredit.balanceOf(contr1Address);

              let tokensBalance = 1666666666666666666666666n;

              expect(balanceOf).to.equal(tokensBalance);
            });
          });
        });

        context("when has two contrs in the era", () => {
          beforeEach(async () => {
            await addInvitation(owner, contr2Address, userTypes.Contributor, owner);
            await addContributor("Contributor B", contr2Address);
          });

          context("with same levels", () => {
            context("when Contributors is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.connect(contr1Address).addContribution("description", "contribution");
                await instance.connect(contr2Address).addContribution("description", "contribution");

                await advanceBlock(contributorPoolParams.blocksPerEra + 2);
                await instance.connect(contr1Address).withdraw();
                await instance.connect(contr2Address).withdraw();
              });

              it("should add contributor1 to era 2", async () => {
                const contributor = await instance.getContributor(contr1Address);

                expect(contributor.pool.currentEra).to.equal(2);
              });

              it("should add contributor2 to era 2", async () => {
                const contributor = await instance.getContributor(contr1Address);

                expect(contributor.pool.currentEra).to.equal(2);
              });

              it("contributor1 balance must be 833333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(contr1Address);

                let tokensPerEra = 833333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("contributor2 balance must be 833333333333333333333333", async () => {
                let balanceOf = await regenerationCredit.balanceOf(contr2Address);

                let tokensPerEra = 833333333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);
            await instance.connect(contr1Address).withdraw();
          });

          it("should return error message", async () => {
            await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith(
              "Not eligible to withdraw for this era"
            );
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);

            await instance.connect(contr1Address).addContribution("description", "contribution");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);

            await instance.connect(contr1Address).withdraw();
            await instance.connect(contr1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await regenerationCredit.balanceOf(contr1Address);
            let tokensPerEra = 3333333333333333333333332n;

            expect(balanceOf).to.equal(tokensPerEra);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith(
            "Not eligible to withdraw for this era"
          );
        });
      });
    });

    context("when is not contributor", () => {
      it("should return error message", async () => {
        await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith("Pool only to contributor");
      });
    });
  });

  describe("addContributionValidation", () => {
    context("with developer", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addInvitation(owner, user4Address, userTypes.Developer, owner);

        await addDeveloper("User A", user1Address);
        await addContributor("Contributor A", contr1Address);
      });

      context("with valid contribution", () => {
        context("when contribution must be invalidated", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(contr1Address);

            expect(userType).to.eq(userTypes.Contributor);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.contributions(1);

            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement contributionsCount in one", async () => {
            const contributionsCount = await instance.contributionsCount();

            expect(contributionsCount).to.eq(0);
          });
        });

        context("when contribution must not be invalidated", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);
            await addDeveloper("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.eq(0);
          });

          it("contributor totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const contribution = await instance.contributions(1);

            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when contributor reach max maxPenalties", () => {
        beforeEach(async () => {
          await addDeveloper("User B", user2Address);
          await addDeveloper("User C", user3Address);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(1, "justification");
          await instance.connect(user2Address).addContributionValidation(1, "justification");

          await advanceBlock(contributorPoolParams.blocksPerEra);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(2, "justification");
          await instance.connect(user3Address).addContributionValidation(2, "justification");

          await advanceBlock(contributorPoolParams.blocksPerEra);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(3, "justification");
          await instance.connect(user2Address).addContributionValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await communityRules.getUser(contr1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid contribution", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await advanceBlock(contributorPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addDeveloper("User B", user2Address);
            await addDeveloper("User C", user3Address);

            await addContribution(contr1Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user3Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(0, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
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
        await addContributor("User", contr1Address);
      });

      context("with valid contribution", () => {
        context("when contribution must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to contributor", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be CONTRIBUTOR yet", async () => {
            const userType = await communityRules.getUser(contr1Address);

            expect(userType).to.eq(userTypes.Contributor);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.contributions(1);
            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(0);
          });

          it("do not must decrement contributionsTotalCount", async () => {
            const contributionsTotalCount = await instance.contributionsTotalCount();

            expect(contributionsTotalCount).to.eq(1);
          });

          it("must decrement contributionsCount in one", async () => {
            const contributionsCount = await instance.contributionsCount();

            expect(contributionsCount).to.eq(0);
          });
        });

        context("when contribution must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addResearcher("User B", user2Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.eq(0);
          });

          it("contributor totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("contributor pool level is 1", async () => {
            const contribution = await instance.contributions(1);
            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when contributor reach max maxPenalties", () => {
        beforeEach(async () => {
          await addResearcher("User B", user2Address);
          await addResearcher("User C", user3Address);
          await addResearcher("User D", user4Address);
          await addResearcher("User E", user5Address);
          await addResearcher("User F", user6Address);
          await addResearcher("User G", user7Address);
          await addResearcher("User H", user8Address);
          await addResearcher("User I", user9Address);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await researcherRules.connect(user1Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user2Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user3Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user4Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user5Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user6Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user7Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user8Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user9Address).addResearch("description", "contribution", "file");

          await advanceBlock(10);

          await researcherRules.connect(user1Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user2Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user3Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user4Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user5Address).addResearch("description", "contribution", "file");

          await advanceBlock(10);

          await researcherRules.connect(user1Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user2Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user3Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user4Address).addResearch("description", "contribution", "file");
          await researcherRules.connect(user5Address).addResearch("description", "contribution", "file");

          await instance.connect(user2Address).addContributionValidation(1, "justification");
          await instance.connect(user3Address).addContributionValidation(1, "justification");

          await instance.connect(user1Address).addContributionValidation(2, "justification");
          await instance.connect(user4Address).addContributionValidation(2, "justification");

          await advanceBlock(10);

          await instance.connect(user5Address).addContributionValidation(3, "justification");
          await instance.connect(user2Address).addContributionValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await communityRules.getUser(contr1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid contribution", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await advanceBlock(contributorPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addResearcher("User B", user2Address);
            await addResearcher("User C", user3Address);
            await addResearcher("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user3Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(0, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
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
        await addInvitation(owner, user5Address, userTypes.Contributor, owner);
        await addInvitation(owner, user6Address, userTypes.Contributor, owner);
        await addInvitation(owner, user7Address, userTypes.Contributor, owner);
        await addInvitation(owner, user8Address, userTypes.Contributor, owner);
        await addInvitation(owner, user9Address, userTypes.Contributor, owner);

        await addContributor("User A", user1Address);
        await addContributor("User", contr1Address);
      });

      context("with valid contribution", () => {
        context("when contribution must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to contributor", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be CONTRIBUTOR yet", async () => {
            const userType = await communityRules.getUser(contr1Address);

            expect(userType).to.eq(userTypes.Contributor);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.contributions(1);
            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(0);
          });

          it("do not must decrement contributionsTotalCount", async () => {
            const contributionsTotalCount = await instance.contributionsTotalCount();

            expect(contributionsTotalCount).to.eq(1);
          });

          it("must decrement contributionsCount in one", async () => {
            const contributionsCount = await instance.contributionsCount();

            expect(contributionsCount).to.eq(0);
          });
        });

        context("when contribution must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addContributor("User B", user2Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.eq(0);
          });

          it("contributor totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("contributor pool level is 1", async () => {
            const contribution = await instance.contributions(1);
            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when contributor reach max maxPenalties", () => {
        beforeEach(async () => {
          await addContributor("User B", user2Address);
          await addContributor("User C", user3Address);
          await addContributor("User D", user4Address);
          await addContributor("User E", user5Address);
          await addContributor("User F", user6Address);
          await addContributor("User G", user7Address);
          await addContributor("User H", user8Address);
          await addContributor("User I", user9Address);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(contr1Address).addContribution("description", "contribution");

          await instance.connect(user1Address).addContribution("description", "contribution");
          await instance.connect(user2Address).addContribution("description", "contribution");
          await instance.connect(user3Address).addContribution("description", "contribution");
          await instance.connect(user4Address).addContribution("description", "contribution");
          await instance.connect(user5Address).addContribution("description", "contribution");
          await instance.connect(user6Address).addContribution("description", "contribution");
          await instance.connect(user7Address).addContribution("description", "contribution");
          await instance.connect(user8Address).addContribution("description", "contribution");
          await instance.connect(user9Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(user1Address).addContribution("description", "contribution");
          await instance.connect(user2Address).addContribution("description", "contribution");
          await instance.connect(user3Address).addContribution("description", "contribution");
          await instance.connect(user4Address).addContribution("description", "contribution");
          await instance.connect(user5Address).addContribution("description", "contribution");

          await advanceBlock(10);

          await instance.connect(user1Address).addContribution("description", "contribution");
          await instance.connect(user2Address).addContribution("description", "contribution");
          await instance.connect(user3Address).addContribution("description", "contribution");
          await instance.connect(user4Address).addContribution("description", "contribution");
          await instance.connect(user5Address).addContribution("description", "contribution");

          await instance.connect(user2Address).addContributionValidation(1, "justification");
          await instance.connect(user3Address).addContributionValidation(1, "justification");

          await instance.connect(user1Address).addContributionValidation(2, "justification");
          await instance.connect(user4Address).addContributionValidation(2, "justification");

          await advanceBlock(10);

          await instance.connect(user5Address).addContributionValidation(3, "justification");
          await instance.connect(user2Address).addContributionValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await communityRules.getUser(contr1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid contribution", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await advanceBlock(contributorPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("description", "contribution");

            await addContributor("User B", user2Address);
            await addContributor("User C", user3Address);
            await addContributor("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user3Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(0, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
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
        await addContributor("Contributor A", contr1Address);
      });

      context("with valid contribution", () => {
        context("when contribution must be invalidated", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);
            await addActivist("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be CONTRIBUTOR yet", async () => {
            const userType = await communityRules.getUser(contr1Address);

            expect(userType).to.eq(userTypes.Contributor);
          });

          it("must remove one pool level from current era", async () => {
            const contribution = await instance.contributions(1);

            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement contributionsCount in one", async () => {
            const contributionsCount = await instance.contributionsCount();

            expect(contributionsCount).to.eq(0);
          });
        });

        context("when contribution must not be invalidated", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);
            await addActivist("User D", user4Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const contribution = await instance.contributions(1);

            expect(contribution.invalidatedAt).to.eq(0);
          });

          it("contributioner totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(contr1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const contribution = await instance.contributions(1);

            const eraLevels = await contributorPool.eraLevels(contribution.era, contr1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when contributioner reach max maxPenalties", () => {
        beforeEach(async () => {
          await addActivist("User B", user2Address);
          await addActivist("User C", user3Address);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(1, "justification");
          await instance.connect(user2Address).addContributionValidation(1, "justification");

          await advanceBlock(contributorPoolParams.blocksPerEra);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(2, "justification");
          await instance.connect(user3Address).addContributionValidation(2, "justification");

          await advanceBlock(contributorPoolParams.blocksPerEra);

          await addContribution(contr1Address);
          await instance.connect(user1Address).addContributionValidation(3, "justification");
          await instance.connect(user2Address).addContributionValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await communityRules.getUser(contr1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid contribution", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addContribution(contr1Address);

            await advanceBlock(contributorPoolParams.blocksPerEra);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addActivist("User B", user2Address);
            await addActivist("User C", user3Address);

            await addContribution(contr1Address);

            await instance.connect(user1Address).addContributionValidation(1, "justification");
            await instance.connect(user2Address).addContributionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(user3Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(user1Address).addContributionValidation(0, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContributionValidation(1, "justification")).to.be.revertedWith(
          "Not a voter user"
        );
      });
    });
  });
});
