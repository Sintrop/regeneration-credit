const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("SupporterRules", () => {
  let instance, communityRules, regenerationCredit, supporterPool, researcherRules;
  let ownerAddress, inv1Address, inv2Address, user1Address;

  const addSupporter = async (name, description, profilePhoto, from) => {
    await instance.connect(from).addSupporter(name, description, profilePhoto);
  };

  const updateProfilePhoto = async (newPhoto, from) => {
    await instance.connect(from).updateProfilePhoto(newPhoto);
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  const addCalculatorItem = async (from) => {
    await researcherRules.connect(from).addCalculatorItem("item", "g", "thesis", 1);
  };

  beforeEach(async () => {
    [ownerAddress, inv1Address, inv2Address, user1Address] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    researcherRules = validatorRulesDeployed.researcherRules;

    const instanceFactory = await ethers.getContractFactory("SupporterRules");
    instance = await instanceFactory.deploy(communityRules.target, researcherRules.target);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(ownerAddress);
    await instance.newAllowedCaller(ownerAddress);
  });

  describe("#addSupporter", () => {
    context("when supporter exists", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await expect(addSupporter("Supporter A", "description", "profilePhoto", inv1Address)).to.be.revertedWith(
          "User already exists"
        );
      });
    });

    context("when supporter don't exist", () => {
      it("create supporter", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.description).to.equal("description");
        expect(supporter.profilePhoto).to.equal("profilePhoto");
        expect(supporter.publicationsCount).to.equal(0);
        expect(supporter.offsetsCount).to.equal(0);
        expect(supporter.reductionItemsCount).to.equal(0);
      });

      it("increment supporterCount", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
        const supportersCount = await communityRules.userTypesCount(userTypes.Supporter);

        expect(supportersCount).to.equal(2);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);

        const userType = await communityRules.getUser(inv1Address);
        const SUPPORTER = 7;

        expect(userType).to.equal(SUPPORTER);
      });
    });
  });

  describe("#updateProfilePhoto", () => {
    context("without supporter", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await expect(updateProfilePhoto("newPhoto", inv2Address)).to.be.revertedWith("Only supporters");
      });
    });

    context("with supporter", () => {
      it("should update photo", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await updateProfilePhoto("newPhoto", inv1Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.profilePhoto).to.equal("newPhoto");
      });
    });
  });

  describe("#getSupporter", () => {
    it("return a supporter", async () => {
      await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      expect(supporter.supporterWallet).to.equal(inv1Address.address);
      expect(supporter.profilePhoto).to.equal("profilePhoto");
    });
  });

  describe("#offset", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
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
              await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
              await transferTokensTo(inv2Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.newAllowedCaller(inv2Address);

                await instance.connect(inv2Address).offset(1000000000000000000n, 1);
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
          });

          context("when SUPPORTER wasn't invited", () => {
            beforeEach(async () => {
              await transferTokensTo(inv1Address, "100000000000000000000");
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.newAllowedCaller(inv1Address);

                await instance.connect(inv1Address).offset(1000000000000000000n, 1);
              });

              it("calculatorItemCertificates to item 1 must be 1000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(1000000000000000000n);
              });
            });

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.newAllowedCaller(inv1Address);

                await instance.connect(inv1Address).offset(5000000000000000000n, 1);
              });

              it("calculatorItemCertificates to item 1 must be 5000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(5000000000000000000n);
              });
            });

            context("when burn multiple times", () => {
              beforeEach(async () => {
                await instance.newAllowedCaller(inv1Address);

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

        context("when calculatorItemId does not exists", () => {
          beforeEach(async () => {
            await instance.newAllowedCaller(inv2Address);
            await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
            await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
            await transferTokensTo(inv2Address, 100000000000000000000n);
          });

          context("when burn 1000000000000000000 tokens", () => {
            it("calculatorItemCertificates to item 10 must be 0", async () => {
              await expect(instance.connect(inv2Address).offset(1000000000000000000n, 10)).to.be.revertedWith(
                "Calculator item does not exist"
              );
            });
          });
        });
      });
    });
  });

  describe("#publish", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
      });

      context("when amount is greater than one", () => {
        context("when publish and burn", () => {
          context("when SUPPORTER was invited", () => {
            beforeEach(async () => {
              await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
              await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
              await transferTokensTo(inv2Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await instance.newAllowedCaller(inv2Address);

                await instance.connect(inv2Address).publish("1000000000000000000", "text", "text");
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
            });
          });
        });
      });
    });
  });

  describe("#declareReductionCommitment", () => {
    beforeEach(async () => {
      await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
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

      context("when try to declared the same item twice", () => {
        it("should return error", async () => {
          await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
          await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

          await addCalculatorItem(user1Address);

          await instance.connect(inv1Address).declareReductionCommitment(1);

          await expect(instance.connect(inv1Address).declareReductionCommitment(1)).to.be.revertedWith(
            "Commitment already declared"
          );
        });
      });

      context("when calculatorItem does not exists", () => {
        it("should return error", async () => {
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
