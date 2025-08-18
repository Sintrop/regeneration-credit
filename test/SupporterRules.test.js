const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("SupporterRules", () => {
  let instance, communityRules, regenerationCredit, researcherRules;
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
    instance = await instanceFactory.deploy(communityRules.target, researcherRules.target, regenerationCredit.target);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(ownerAddress);
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

  describe("#declareReductionCommitment", () => {
    beforeEach(async () => {
      await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
    });

    context("when is supporter", () => {
      context("when calculatorItem exists", () => {
        beforeEach(async () => {
          await communityRules.setContractCall(ownerAddress, ownerAddress);
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
          await communityRules.setContractCall(ownerAddress, ownerAddress);
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
