const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupporterRules", () => {
  let instance, userContract, regenerationCredit, supporterPool;
  let ownerAddress, inv1Address, inv2Address;

  const addSupporter = async (name, from) => {
    await instance.connect(from).addSupporter(name);
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    [ownerAddress, inv1Address, inv2Address] = await ethers.getSigners();

    userContract = await userContractDeployed();

    regenerationCredit = await regenerationCreditDeployed();

    const supporterPoolFactory = await ethers.getContractFactory("SupporterPool");
    supporterPool = await supporterPoolFactory.deploy(regenerationCredit.target);

    const instanceFactory = await ethers.getContractFactory("SupporterRules");
    instance = await instanceFactory.deploy(userContract.target, supporterPool.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(ownerAddress);
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
        const supportersCount = await userContract.userTypesCount(userTypes.Supporter);

        expect(supportersCount).to.equal(2);
      });

      it("add created supporter in supporterList", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);

        const supporters = await instance.getSupporters();

        expect(supporters[0].supporterWallet).to.equal(inv1Address.address);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", inv1Address);

        const userType = await userContract.getUser(inv1Address);
        const SUPPORTER = 7;

        expect(userType).to.equal(SUPPORTER);
      });
    });
  });

  describe("#getSupporters", () => {
    context("when have supporters", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);
      });

      it("return supporters when has supporters", async () => {
        const supporters = await instance.getSupporters();

        expect(supporters.length).to.equal(2);
      });
    });

    context("when dont have supporters", () => {
      it("return empty supporters array", async () => {
        const supporters = await instance.getSupporters();

        expect(supporters.length).to.equal(0);
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

  describe("#burnTokens", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", inv1Address);
      });

      context("when amount is greater than zero", () => {
        context("when SUPPORTER was invited", () => {
          beforeEach(async () => {
            await userContract.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
            await addSupporter("Supporter B", inv2Address);
            await transferTokensTo(inv2Address, 100000000000000000000n);
          });

          context("when burn 1000000000000000000 tokens", () => {
            beforeEach(async () => {
              await instance.connect(inv2Address).burnTokens(1000000000000000000n);
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
          });

          context("when burn 500000000000000000 tokens", () => {
            beforeEach(async () => {
              await instance.connect(inv2Address).burnTokens(500000000000000000n);
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
              await instance.connect(inv1Address).burnTokens(1000000000000000000n);
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
              await instance.connect(inv1Address).burnTokens(500000000000000000n);
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

      context("when amount is equal zero", () => {
        it("should return error", async () => {
          await expect(instance.connect(inv1Address).burnTokens(0)).to.be.revertedWith("Amount invalid");
        });
      });
    });

    context("when msg.sender is not SUPPORTER", () => {
      it("should return error", async () => {
        await expect(instance.connect(inv1Address).burnTokens(1)).to.be.revertedWith("Only supporters");
      });
    });
  });
});
