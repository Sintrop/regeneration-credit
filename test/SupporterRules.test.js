const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("SupporterRules", () => {
  let instance, communityRules, regenerationCredit, supporterPool, researcherRules;
  let ownerAddress, inv1Address, inv2Address, user1Address;

  const addSupporter = async (name, from) => {
    await instance.connect(from).addSupporter(name);
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  const addCalculatorItem = async (from) => {
    await researcherRules.connect(from).addCalculatorItem("title", "kg", "justification", 1);
  };

  const reseacherPoolArgs = {
    totalResearcherPoolTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [ownerAddress, inv1Address, inv2Address, user1Address] = await ethers.getSigners();

    communityRules = await communityRulesDeployed();

    regenerationCredit = await regenerationCreditDeployed();

    const supporterPoolFactory = await ethers.getContractFactory("SupporterPool");
    supporterPool = await supporterPoolFactory.deploy(regenerationCredit.target);

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    const researcherPool = await researcherPoolFactory.deploy(
      regenerationCredit.target,
      reseacherPoolArgs.halving,
      reseacherPoolArgs.blocksPerEra
    );

    const reseacherMaxPenalties = 3;
    const reseacherTimeBetweenResearches = 10;
    const researcherSecuryBlocksToAnalysis = 10;
    const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");

    researcherRules = await researcherRulesFactory.deploy(
      communityRules.target,
      researcherPool.target,
      ZERO_ADDRESS,
      reseacherTimeBetweenResearches,
      reseacherMaxPenalties,
      researcherSecuryBlocksToAnalysis
    );

    const instanceFactory = await ethers.getContractFactory("SupporterRules");
    instance = await instanceFactory.deploy(communityRules.target, supporterPool.target, researcherRules.target);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(ownerAddress);
    await supporterPool.newAllowedCaller(instance.target);
    await regenerationCredit.addContractPool(supporterPool.target, 0);
  });

  describe("#addSupporter", () => {
    context("when supporter exists", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", inv1Address);
        await expect(addSupporter("Supporter A", inv1Address)).to.be.revertedWith("User already exists");
      });
    });

    context("when supporter don't exist", () => {
      it("create supporter", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
      });

      it("increment supporterCount", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);
        const supportersCount = await communityRules.userTypesCount(userTypes.Supporter);

        expect(supportersCount).to.equal(2);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", inv1Address);

        const userType = await communityRules.getUser(inv1Address);
        const SUPPORTER = 7;

        expect(userType).to.equal(SUPPORTER);
      });
    });
  });

  describe("#getSupporter", () => {
    it("return a supporter", async () => {
      await addSupporter("Supporter A", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      expect(supporter.supporterWallet).to.equal(inv1Address.address);
    });
  });

  describe("#offset", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", inv1Address);
      });

      context("when amount is greater than zero", () => {
        context("when calculatorItemId exists", () => {
          beforeEach(async () => {
            await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
            await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

            await addCalculatorItem(user1Address);
          });

          context("when SUPPORTER was invited", () => {
            beforeEach(async () => {
              await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
              await addSupporter("Supporter B", inv2Address);
              await transferTokensTo(inv2Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).offset(1000000000000000000n, 1);
              });

              it("Supporter balance must be 99000000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(99000000000000000000n);
              });

              it("Supporter inviter balance must be 50000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(50000000000000000n);
              });

              it("totalCertified must be 950000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(950000000000000000n);
              });

              it("calculatorItemCertificates to item 1 must be 950000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv2Address, 1);

                expect(value).to.equal(950000000000000000n);
              });

              it("must add offset amount", async () => {
                const offset = await instance.offsets(1);
                expect(offset.supporterAddress).to.equal(inv2Address);
                expect(offset.amountBurn).to.equal("950000000000000000");
                expect(offset.calculatorItemId).to.equal(1);
              });

              it("must add offset count", async () => {
                const offsetsCount = await instance.offsetsCount();
                expect(offsetsCount).to.equal(1);
              });
            });

            context("when burn 500000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).offset(500000000000000000n, 1);
              });

              it("Supporter balance must be 99500000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(99500000000000000000n);
              });

              it("Supporter inviter balance must be 25000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(25000000000000000n);
              });

              it("totalCertified must be 475000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(475000000000000000n);
              });
            });
          });

          context("when SUPPORTER wasn't invited", () => {
            beforeEach(async () => {
              await transferTokensTo(inv1Address, "100000000000000000000");
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).offset(1000000000000000000n, 1);
              });

              it("Supporter balance must be 99000000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(99000000000000000000n);
              });

              it("totalCertified must be 1000000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(1000000000000000000n);
              });

              it("calculatorItemCertificates to item 1 must be 1000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(1000000000000000000n);
              });
            });

            context("when burn 500000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).offset(500000000000000000n, 1);
              });

              it("Supporter balance must be 99500000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(99500000000000000000n);
              });

              it("totalCertified must be 500000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(500000000000000000n);
              });

              it("calculatorItemCertificates to item 1 must be 500000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(500000000000000000n);
              });
            });
          });
        });

        context("when calculatorItemId does not exists", () => {
          beforeEach(async () => {
            await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
            await addSupporter("Supporter B", inv2Address);
            await transferTokensTo(inv2Address, 100000000000000000000n);
            await instance.connect(inv2Address).offset(1000000000000000000n, 10);
          });

          context("when burn 1000000000000000000 tokens", () => {
            it("calculatorItemCertificates to item 10 must be 0", async () => {
              const value = await instance.calculatorItemCertificates(inv2Address, 10);

              expect(value).to.equal(0);
            });
          });
        });
      });

      context("when amount is equal zero", () => {
        it("should return error", async () => {
          await expect(instance.connect(inv1Address).offset(0, 0)).to.be.revertedWith("Amount invalid");
        });
      });
    });

    context("when msg.sender is not SUPPORTER", () => {
      it("should return error", async () => {
        await expect(instance.connect(inv1Address).offset(1, 0)).to.be.revertedWith("Only supporters");
      });
    });
  });

  describe("#publish", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", inv1Address);
      });

      context("when amount is greater than zero", () => {
        context("when publish and burn", () => {
          context("when SUPPORTER was invited", () => {
            beforeEach(async () => {
              await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
              await addSupporter("Supporter B", inv2Address);
              await transferTokensTo(inv2Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).publish("1000000000000000000", "text", "text");
              });

              it("Supporter balance must be 99000000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(99000000000000000000n);
              });

              it("Supporter inviter balance must be 50000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(50000000000000000n);
              });

              it("totalCertified must be 950000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(950000000000000000n);
              });

              it("must add publication amount", async () => {
                const publication = await instance.publications(1);
                expect(publication.supporterAddress).to.equal(inv2Address);
                expect(publication.amount).to.equal("950000000000000000");
                expect(publication.description).to.equal("text");
                expect(publication.content).to.equal("text");
              });

              it("must add publication count", async () => {
                const publicationsCount = await instance.publicationsCount();
                expect(publicationsCount).to.equal(1);
              });
            });

            context("when burn 500000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).publish(500000000000000000n, "text", "text");
              });

              it("Supporter balance must be 99500000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(99500000000000000000n);
              });

              it("Supporter inviter balance must be 25000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(25000000000000000n);
              });

              it("totalCertified must be 475000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(475000000000000000n);
              });
            });
          });

          context("when SUPPORTER wasn't invited", () => {
            beforeEach(async () => {
              await transferTokensTo(inv1Address, "100000000000000000000");
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).publish(1000000000000000000n, "text", "text");
              });

              it("Supporter balance must be 99000000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(99000000000000000000n);
              });

              it("totalCertified must be 1000000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(1000000000000000000n);
              });
            });

            context("when burn 500000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).publish(500000000000000000n, "text", "text");
              });

              it("Supporter balance must be 99500000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(99500000000000000000n);
              });

              it("totalCertified must be 500000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(500000000000000000n);
              });
            });
          });
        });
      });

      context("when amount is equal zero", () => {
        it("should return error", async () => {
          await expect(instance.connect(inv1Address).publish(0, "text", "text")).to.be.revertedWith("Amount invalid");
        });
      });

      context("when amount is below one and more than zero", () => {
        it("should return error", async () => {
          await transferTokensTo(inv1Address, "100000000000000000000");
          await expect(instance.connect(inv1Address).publish(1, "text", "text")).to.be.revertedWith("Amount invalid");
        });
      });
    });

    context("when msg.sender is not SUPPORTER", () => {
      it("should return error", async () => {
        await expect(instance.connect(inv1Address).publish(1, "text", "text")).to.be.revertedWith("Only supporters");
      });
    });
  });

  describe("#declareReductionCommitment", () => {
    beforeEach(async () => {
      await addSupporter("Supporter A", inv1Address);
    });

    context("when is supporter", () => {
      context("when calculatorItem exists", () => {
        beforeEach(async () => {
          await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
          await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

          await addCalculatorItem(user1Address);

          await instance.connect(inv1Address).declareReductionCommitment(1);
        });

        it("return a supporter", async () => {
          const reductionCommitments = await instance.getReductionCommitments(inv1Address);

          expect(reductionCommitments[0]).to.eq(1);
        });
      });

      context("when calculatorItem does not exists", () => {
        it("return a supporter", async () => {
          await expect(instance.connect(inv1Address).declareReductionCommitment(100)).to.be.revertedWith(
            "Calculator item does not exist"
          );
        });
      });
    });

    context("when is not a supporter", () => {
      it("return a supporter", async () => {
        await expect(instance.connect(user1Address).declareReductionCommitment(100)).to.be.revertedWith(
          "Only supporters"
        );
      });
    });
  });
});
