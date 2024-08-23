const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { ethers } = require("hardhat");

describe("ContributorContract", (accounts) => {
  let instance;
  let userContract;
  let contributorPool;
  let regenerationCredit;
  let owner, contr1Address, contr2Address, contr3Address;

  let contributorPoolParams = {
    totalTokens: "7500000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  const addContributor = async (name, from) => {
    await instance.connect(from).addContributor(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, contr1Address, contr2Address, contr3Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    userContract = await userContractDeployed();

    contributorPoolFactory = await ethers.getContractFactory("ContributorPool");
    contributorPool = await contributorPoolFactory.deploy(
      regenerationCredit.target,
      contributorPoolParams.halving,
      contributorPoolParams.totalEras,
      contributorPoolParams.blocksPerEra
    );

    contributorContractFactory = await ethers.getContractFactory("ContributorContract");
    instance = await contributorContractFactory.deploy(userContract.target, contributorPool.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await contributorPool.newAllowedCaller(instance.target);
    await regenerationCredit.addContractPool(contributorPool.target, "30000000000000000000000000");

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

          await expect(addContributor("Contributor A", contr1Address)).to.be.revertedWith(
            "This contributor already exist"
          );
        });
      });

      context("when contributor does not exist", () => {
        it("should add contributor", async () => {
          await addContributor("Contributor A", contr1Address);
          const contributor = await instance.getContributor(contr1Address);

          expect(contributor.contributorWallet).to.equal(contr1Address.address);
        });

        it("should increment contributorsCount after create contributor", async () => {
          await addContributor("Contributor A", contr1Address);
          const contributorsCount = await userContract.userTypesCount(userTypes.Contributor);

          expect(contributorsCount).to.equal(1);
        });

        it("should add created contributor in contributorList (array)", async () => {
          await addContributor("Contributor A", contr1Address);

          const contributors = await instance.getContributors();

          expect(contributors[0].contributorWallet).to.equal(contr1Address.address);
        });

        it("should add created contributor in userType contract as a CONTRIBUTOR", async () => {
          await addContributor("Contributor A", contr1Address);

          const userType = await userContract.getUser(contr1Address);
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
    });
  });

  describe("addContribution", () => {
    beforeEach(async () => {
      await addContributor("Contributor A", contr1Address);
    });

    context("with contributor", () => {
      context("when already has contribution", () => {
        beforeEach(async () => {
          await instance.connect(contr1Address).addContribution("report");
        });

        it("should return error message", async () => {
          await expect(instance.connect(contr1Address).addContribution("report")).to.be.revertedWith(
            "Already has contribution"
          );
        });
      });

      context("when don't have contribution", () => {
        beforeEach(async () => {
          await instance.connect(contr1Address).addContribution("report");
        });

        it("add contribution id", async () => {
          const construbution = await instance.contributions(1, contr1Address);

          expect(construbution.id).to.equal(1);
        });

        it("add contribution", async () => {
          const construbution = await instance.contributions(1, contr1Address);

          expect(construbution.report).to.equal("report");
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
          const construbution = await instance.contributions(1, contr1Address);

          expect(construbution.user).to.equal(contr1Address.address);
        });

        it("increment contributiosCount", async () => {
          const contributionsCount = await instance.contributionsCount();

          expect(contributionsCount).to.equal(1);
        });
      });
    });

    context("without contributor", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContribution("report")).to.be.revertedWith("Only Contributor");
      });
    });
  });

  describe("#getContribution", () => {
    beforeEach(async () => {
      await addContributor("Contributor A", contr1Address);
      await instance.connect(contr1Address).addContribution("report");
    });

    it("should have fields", async () => {
      const contribution = await instance.getContribution(1);

      expect(contribution.id).to.equal("1");
      expect(contribution.era).to.equal("1");
      expect(contribution.user).to.equal(contr1Address.address);
      expect(contribution.level).to.equal("0");
      expect(contribution.report).to.equal("report");
    });
  });

  describe("#getContributors", () => {
    beforeEach(async () => {
      await addInvitation(owner, contr2Address, userTypes.Contributor, owner);
    });
    it("should return contributors when has contributors", async () => {
      await addContributor("Contributor A", contr1Address);
      await addContributor("Contributor B", contr2Address);

      const contributors = await instance.getContributors();

      expect(contributors.length).to.equal(2);
    });

    it("should return contributors equal zero when dont has it", async () => {
      const contributors = await instance.getContributors();

      expect(contributors.length).to.equal(0);
    });
  });

  describe("#getContributor", () => {
    it("should return a contributor", async () => {
      await addContributor("Contributor A", contr1Address);

      const contributor = await instance.getContributor(contr1Address);

      expect(contributor.contributorWallet).to.equal(contr1Address.address);
    });
  });

  describe("#contributorExists", () => {
    it("should return true when exists", async () => {
      await addContributor("Contributor A", contr1Address);
      const contributorExists = await instance.contributorExists(contr1Address);

      expect(contributorExists).to.equal(true);
    });

    it("it should return false when don't exists", async () => {
      const contributorExists = await instance.contributorExists(contr1Address);

      expect(contributorExists).to.equal(false);
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
              await instance.connect(contr1Address).addContribution("report");

              await advanceBlock(contributorPoolParams.blocksPerEra + 2);
              await instance.connect(contr1Address).withdraw();
            });

            it("should add contributor to era 2", async () => {
              const contributor = await instance.getContributor(contr1Address);

              expect(contributor.pool.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await regenerationCredit.balanceOf(contr1Address);

              let tokensBalance = 300000000000000000000000n;

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
                await instance.connect(contr1Address).addContribution("report");
                await instance.connect(contr2Address).addContribution("report");

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

              it("contributor1 balance must be 150000000000000000000000", async () => {
                let balanceOf = await regenerationCredit.balanceOf(contr1Address);

                let tokensPerEra = 150000000000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("contributor2 balance must be 150000000000000000000000", async () => {
                let balanceOf = await regenerationCredit.balanceOf(contr2Address);

                let tokensPerEra = 150000000000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("report");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);
            await instance.connect(contr1Address).withdraw();
          });

          it("should return error message", async () => {
            await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(contr1Address).addContribution("report");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);

            await instance.connect(contr1Address).addContribution("report");
            await advanceBlock(contributorPoolParams.blocksPerEra + 2);

            await instance.connect(contr1Address).withdraw();
            await instance.connect(contr1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await regenerationCredit.balanceOf(contr1Address);
            let tokensPerEra = 600000000000000000000000n;

            expect(balanceOf).to.equal(tokensPerEra);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });
    });

    context("when is not contributor", () => {
      it("should return error message", async () => {
        await expect(instance.connect(contr1Address).withdraw()).to.be.revertedWith("Pool only to contributor");
      });
    });
  });
});
