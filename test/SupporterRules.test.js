const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("SupporterRules", () => {
  let instance, communityRules, regenerationCredit, supporterPool, researcherRules;
  let ownerAddress, inv1Address, inv2Address, user1Address;

  const addSupporter = async (name, profilePhoto, from) => {
    await instance.connect(from).addSupporter(name, profilePhoto);
  };

  const updateProfilePhoto = async (newPhoto, from) => {
    await instance.connect(from).updateProfilePhoto(newPhoto);
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  const addCalculatorItem = async (from) => {
    await researcherRules.connect(from).addCalculatorItem("title", "kg", "justification", 1);
  };

  const reseacherPoolArgs = {
    totalResearcherPoolTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [ownerAddress, inv1Address, inv2Address, user1Address] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    researcherRules = validatorRulesDeployed.researcherRules;

    const supporterPoolFactory = await ethers.getContractFactory("SupporterPool");
    supporterPool = await supporterPoolFactory.deploy(regenerationCredit.target);

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
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
        await expect(addSupporter("Supporter A", "profilePhoto", inv1Address)).to.be.revertedWith(
          "User already exists"
        );
      });
    });

    context("when supporter don't exist", () => {
      it("create supporter", async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "profilePhoto", inv2Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.profilePhoto).to.equal("profilePhoto");
        expect(supporter.publicationsCount).to.equal(0);
        expect(supporter.offsetsCount).to.equal(0);
        expect(supporter.reductionItemsCount).to.equal(0);
      });

      it("increment supporterCount", async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "profilePhoto", inv2Address);
        const supportersCount = await communityRules.userTypesCount(userTypes.Supporter);

        expect(supportersCount).to.equal(2);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);

        const userType = await communityRules.getUser(inv1Address);
        const SUPPORTER = 7;

        expect(userType).to.equal(SUPPORTER);
      });
    });
  });

  describe("#updateProfilePhoto", () => {
    context("without supporter", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
        await expect(updateProfilePhoto("newPhoto", inv2Address)).to.be.revertedWith("Only supporters");
      });
    });

    context("with supporter", () => {
      it("should update photo", async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
        await updateProfilePhoto("newPhoto", inv1Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.profilePhoto).to.equal("newPhoto");
      });
    });
  });

  describe("#getSupporter", () => {
    it("return a supporter", async () => {
      await addSupporter("Supporter A", "profilePhoto", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      expect(supporter.supporterWallet).to.equal(inv1Address.address);
      expect(supporter.profilePhoto).to.equal("profilePhoto");
    });
  });

  describe("#offset", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
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
              await addSupporter("Supporter B", "profilePhoto", inv2Address);
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

              it("must add offset total count", async () => {
                const offsetsCount = await instance.offsetsCount();
                expect(offsetsCount).to.equal(1);
              });

              it("must add offset supporter count", async () => {
                const supporter = await instance.getSupporter(inv2Address);
                expect(supporter.offsetsCount).to.equal(1);
              });
            });

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).offset(5000000000000000000n, 1);
              });

              it("Supporter balance must be 95000000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(95000000000000000000n);
              });

              it("Supporter inviter balance must be 250000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(250000000000000000n);
              });

              it("totalCertified must be 4750000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(4750000000000000000n);
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

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).offset(5000000000000000000n, 1);
              });

              it("Supporter balance must be 95000000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(95000000000000000000n);
              });

              it("totalCertified must be 5000000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(5000000000000000000n);
              });

              it("calculatorItemCertificates to item 1 must be 5000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(5000000000000000000n);
              });
            });

            context("when burn multiple times", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).offset(1000000000000000000n, 1);
                await instance.connect(inv1Address).offset(1000000000000000000n, 1);
                await instance.connect(inv1Address).offset(1500000000000000000n, 1);
              });

              it("calculatorItemCertificates must sum all offsets", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(3500000000000000000n);
              });
            });
          });
        });

        context("when amount is equal zero", () => {
          it("should return error", async () => {
            await expect(instance.connect(inv1Address).offset(0, 1)).to.be.revertedWith("Amount invalid");
          });
        });

        context("when amount is below one and more than zero", () => {
          it("should return error", async () => {
            await transferTokensTo(inv1Address, "100000000000000000000");
            await expect(instance.connect(inv1Address).offset(100, 1)).to.be.revertedWith("Amount invalid");
          });
        });

        context("when calculatorItemId does not exists", () => {
          beforeEach(async () => {
            await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
            await addSupporter("Supporter B", "profilePhoto", inv2Address);
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
        await addSupporter("Supporter A", "profilePhoto", inv1Address);
      });

      context("when amount is greater than one", () => {
        context("when publish and burn", () => {
          context("when SUPPORTER was invited", () => {
            beforeEach(async () => {
              await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
              await addSupporter("Supporter B", "profilePhoto", inv2Address);
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

              it("must add publication supporter count", async () => {
                const supporter = await instance.getSupporter(inv2Address);
                expect(supporter.publicationsCount).to.equal(1);
              });
            });

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv2Address).publish(5000000000000000000n, "text", "text");
              });

              it("Supporter balance must be 95000000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv2Address);
                expect(balance).to.equal(95000000000000000000n);
              });

              it("Supporter inviter balance must be 250000000000000000", async () => {
                const balance = await supporterPool.balanceOf(inv1Address);
                expect(balance).to.equal(250000000000000000n);
              });

              it("totalCertified must be 4750000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();
                expect(totalCertified).to.equal(4750000000000000000n);
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

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.connect(inv1Address).publish(5000000000000000000n, "text", "text");
              });

              it("Supporter balance must be 95000000000000000000", async () => {
                const supporterBalance = await supporterPool.balanceOf(inv1Address);

                expect(supporterBalance).to.equal(95000000000000000000n);
              });

              it("totalCertified must be 5000000000000000000", async () => {
                const totalCertified = await regenerationCredit.totalCertified();

                expect(totalCertified).to.equal(5000000000000000000n);
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
          await expect(instance.connect(inv1Address).publish(100, "text", "text")).to.be.revertedWith("Amount invalid");
        });
      });

      context("when string is bigger than MAX_CARACHTERES", () => {
        it("should return error", async () => {
          await transferTokensTo(inv1Address, "100000000000000000000");
          await expect(
            instance
              .connect(inv1Address)
              .publish(
                "1000000000000000000",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                "text"
              )
          ).to.be.revertedWith("Max 1000 characters");
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
      await addSupporter("Supporter A", "profilePhoto", inv1Address);
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

        it("must add reduction item supporter count", async () => {
          const supporter = await instance.getSupporter(inv1Address);
          expect(supporter.reductionItemsCount).to.equal(1);
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
