const { ethers } = require("hardhat");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { expect } = require("chai");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { userTypes } = require("./shared/user_types");

describe("RegenerationCredit", (accounts) => {
  let instance, communityRules, supporterRules, researcherRules;
  let ownerAddress, user1Address, user2Address, supporter1Address, researcher1Address, anyContractAddress;
  let regeneratorPool;

  let args = {
    totalRegenerationCredits: "1500000000000000000000000000",
  };

  const argsRegeneratorPool = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const addSupporter = async (name, description, profilePhoto, from) => {
    await supporterRules.connect(from).addSupporter(name, description, profilePhoto);
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [ownerAddress, user1Address, user2Address, supporter1Address, researcher1Address, anyContractAddress] =
      await ethers.getSigners();

    const instanceFactory = await ethers.getContractFactory("RegenerationCredit");
    instance = await instanceFactory.deploy(args.totalRegenerationCredits);
    communityRules = await communityRulesDeployed();

    const reseacherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    const researcherPool = await reseacherPoolFactory.deploy(instance.target, 12, 12);

    const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
    researcherRules = await researcherRulesFactory.deploy(3, 10, 10);

    const supporterRulesFactory = await ethers.getContractFactory("SupporterRules");
    supporterRules = await supporterRulesFactory.deploy(communityRules.target, researcherRules.target);

    const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");
    regeneratorPool = await regeneratorPoolFactory.deploy(
      instance.target,
      argsRegeneratorPool.halving,
      argsRegeneratorPool.blocksPerEra
    );

    const researcherRulesContractDependencies = {
      communityRulesAddress: communityRules.target,
      researcherPoolAddress: researcherPool.target,
      validationRulesAddress: ZERO_ADDRESS,
      voteRulesAddress: ZERO_ADDRESS,
    };

    await researcherRules.setContractAddressDependencies(researcherRulesContractDependencies);

    await instance.setContractDependencies(supporterRules.target);
    await supporterRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(supporterRules.target);
    await communityRules.newAllowedCaller(ownerAddress);
  });

  describe(".afterDeploy", () => {
    it("total suply should be equal to 1500000000000000000000000000", async () => {
      const totalSupply = await instance.totalSupply();
      expect(totalSupply).to.equal(args.totalRegenerationCredits);
    });

    it("totalCertified should be equal zero", async () => {
      const totalCertified = await instance.totalCertified();
      expect(totalCertified).to.equal(0);
    });

    it("totalLocked should be equal zero", async () => {
      const totalLocked = await instance.totalLocked();
      expect(totalLocked).to.equal(0);
    });

    it("balance of contract owner should be equal to 1500000000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      expect(ownerBalance).to.equal(1500000000000000000000000000n);
    });
  });

  describe("#addContractPool", () => {
    context("when totalTokens is bigger than tokens contract owner", () => {
      beforeEach(async () => {
        await instance.addContractPool(regeneratorPool.target, "100000000000000000000000000");
      });

      it("it should add totalLocked tokens", async () => {
        const totalLocked = await instance.totalLocked();

        expect(totalLocked).to.equal("100000000000000000000000000");
      });

      it("it should add as a contract pool", async () => {
        const contractPool = await instance.contractPool(regeneratorPool.target);

        expect(contractPool).to.equal(true);
      });

      it("it should have balance", async () => {
        const balanceOf = await instance.balanceOf(regeneratorPool.target);

        expect(balanceOf).to.equal("100000000000000000000000000");
      });
    });

    context("when totalTokens is less than tokens contract owner", () => {
      it("must return erro message", async () => {
        await expect(instance.transfer(regeneratorPool.target, "8000000000000000000000000000")).to.be.revertedWith(
          "ERC20: transfer amount exceeds balance"
        );
      });
    });
  });

  describe("#transfer", () => {
    context("when user have tokens", () => {
      context("when a user transfer 100000000000000000000 sac token", () => {
        it("it should transfer when user has tokens", async () => {
          await instance.transfer(user1Address, "100000000000000000000");
          const balanceOf = await instance.balanceOf(user1Address);
          expect(balanceOf).to.equal("100000000000000000000");
        });
      });
    });

    context("when user doesn't have tokens", () => {
      it("must return erro message", async () => {
        await expect(instance.connect(user2Address).transfer(user1Address, "100000000000000000000")).to.be.revertedWith(
          "ERC20: transfer amount exceeds balance"
        );
      });
    });
  });

  describe("#approve", () => {
    beforeEach(async () => {
      await instance.approve(user1Address, "100000000000000000000");
    });

    it("it should transfer when user has tokens", async () => {
      const allowance = await instance.allowance(ownerAddress, user1Address);

      expect(allowance).to.equal("100000000000000000000");
    });
  });

  describe("#transferFrom", () => {
    context("when user is approved to transfer from other address", () => {
      beforeEach(async () => {
        await instance.approve(user1Address, "100000000000000000000");
        await instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "1000000000000000000");
      });

      context("when tokenOwner is sufficient to transfer", () => {
        it("user2Address must receive 1000000000000000000 tokens", async () => {
          const balanceOf = await instance.balanceOf(user2Address);

          expect(balanceOf).to.equal("1000000000000000000");
        });

        it("owner tokens must be decremented to 1499999999000000000000000000", async () => {
          const balanceOf = await instance.balanceOf(ownerAddress);

          expect(balanceOf).to.equal("1499999999000000000000000000");
        });
      });

      context("when tokenOwner is not sufficiente to transfer", () => {
        it("must return erro message", async () => {
          await expect(
            instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "13754999990000000000000000000")
          ).to.be.revertedWith("ERC20: insufficient allowance");
        });
      });
    });

    context("when user is not approved to transfer from other address", () => {
      it("must return erro message", async () => {
        await expect(
          instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "1000000000000000000")
        ).to.be.revertedWith("ERC20: insufficient allowance");
      });
    });
  });

  describe("#burnTokens", () => {
    context("when user have tokens", () => {
      beforeEach(async () => {
        await instance.transfer(user1Address, "200000000000000000000");
        await instance.connect(user1Address).burnTokens("100000000000000000000");
      });

      context("when burn 100000000000000000000 tokens", () => {
        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          expect(burnedTokens).to.equal("100000000000000000000");
        });

        it("should add 100000000000000000000 to user certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          expect(userCertificate).to.equal("100000000000000000000");
        });

        it("should add 100000000000000000000 to totalCertified", async () => {
          const totalBurned = await instance.totalCertified();

          expect(totalBurned).to.equal("100000000000000000000");
        });
      });

      context("when burn another 100000000000000000000 tokens", () => {
        beforeEach(async () => {
          await instance.connect(user1Address).burnTokens("100000000000000000000");
        });

        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          expect(burnedTokens).to.equal("0");
        });

        it("should increase 100000000000000000000 tokens to certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          expect(userCertificate).to.equal("200000000000000000000");
        });

        it("should increase totalCertified in 100000000000000000000", async () => {
          const totalCertified = await instance.totalCertified();

          expect(totalCertified).to.equal("200000000000000000000");
        });
      });
    });

    context("when user does not have tokens", () => {
      it("must return error message", async () => {
        await expect(instance.connect(user2Address).burnTokens("100000000000000000000")).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );
      });
    });
  });

  describe("#totalLocked", () => {
    context("when add contract pool", () => {
      beforeEach(async () => {
        await instance.addContractPool(regeneratorPool.target, argsRegeneratorPool.totalTokens);
      });

      it("it should set totalLocked to 750000000000000000000000000", async () => {
        const totalLocked = await instance.totalLocked();
        expect(totalLocked).to.equal(750000000000000000000000000n);
      });
    });
  });

  describe("#offset", () => {
    context("when is supporter", () => {
      beforeEach(async () => {
        await communityRules.setContractCall(ownerAddress);
        await addInvitation(ownerAddress, researcher1Address, userTypes.Researcher, ownerAddress);
        await addInvitation(ownerAddress, supporter1Address, userTypes.Supporter, ownerAddress);

        await addResearcher("Researcher A", researcher1Address);
        await addSupporter("Supporter A", "description", "profilePhoto", supporter1Address);

        await instance.transfer(supporter1Address, 10000000000000000000n);
      });

      context("when amount is valid", () => {
        beforeEach(async () => {
          await researcherRules.connect(researcher1Address).addCalculatorItem("item", "thesis", "uni", 100);

          await instance.connect(supporter1Address).offset(1000000000000000000n, 1);
        });

        it("inviter balance must increment in 50000000000000000", async () => {
          const balanceOf = await instance.balanceOf(ownerAddress);

          expect(balanceOf).to.eq(1499999990050000000000000000n);
        });

        it("supporter balance must be 9000000000000000000", async () => {
          const balanceOf = await instance.balanceOf(supporter1Address);

          expect(balanceOf).to.eq(9000000000000000000n);
        });
      });

      context("when amount is invalid", () => {
        it("must return error message", async () => {
          await expect(instance.connect(supporter1Address).offset(100000000000000000n, 1)).to.be.revertedWith(
            "Amount must be at least 1 RC"
          );
        });
      });
    });

    context("when is not supporter", () => {
      it("must return error message", async () => {
        await expect(instance.connect(anyContractAddress).offset("100000000000000000000", 1)).to.be.revertedWith(
          "Only supporters"
        );
      });
    });
  });

  describe("#publish", () => {
    context("when is supporter", () => {
      beforeEach(async () => {
        await communityRules.setContractCall(ownerAddress);
        await addInvitation(ownerAddress, supporter1Address, userTypes.Supporter, ownerAddress);
        await addSupporter("Supporter A", "description", "profilePhoto", supporter1Address);

        await instance.transfer(supporter1Address, 10000000000000000000n);
      });

      context("when amount is valid", () => {
        beforeEach(async () => {
          await instance.connect(supporter1Address).publish(10000000000000000000n, "description", "content");
        });

        it("inviter balance must increment in 50000000000000000", async () => {
          const balanceOf = await instance.balanceOf(ownerAddress);

          expect(balanceOf).to.eq(1499999990500000000000000000n);
        });

        it("supporter balance must be 0", async () => {
          const balanceOf = await instance.balanceOf(supporter1Address);

          expect(balanceOf).to.eq(0);
        });

        context("when content and description are invalids", () => {
          it("must return error message", async () => {
            const longString = "x".repeat(650);

            await expect(
              instance.connect(supporter1Address).publish(10000000000000000000n, longString, longString)
            ).to.be.revertedWith("Max 600 characters");
          });
        });
      });

      context("when amount is invalid", () => {
        it("must return error message", async () => {
          await expect(
            instance.connect(supporter1Address).publish(100000000000000000n, "description", "content")
          ).to.be.revertedWith("Amount must be at least 10 RC");
        });
      });
    });

    context("when is not supporter", () => {
      it("must return error message", async () => {
        await expect(
          instance.connect(anyContractAddress).publish(100000000000000000000n, "description", "content")
        ).to.be.revertedWith("Only supporters");
      });
    });
  });
});
