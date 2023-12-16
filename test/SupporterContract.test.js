const SupporterContract = artifacts.require("SupporterContract");
const SupporterPool = artifacts.require("SupporterPool");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { rcTokenDeployed } = require("./shared/rc_token_deployed");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("SupporterContract", (accounts) => {
  let instance, userContract, rcToken, supporterPool;
  const [ownerAddress, inv1Address, inv2Address] = accounts;

  const addSupporter = async (name, address) => {
    await instance.addSupporter(name, { from: address });
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await rcToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    userContract = await userContractDeployed();

    rcToken = await rcTokenDeployed();
    supporterPool = await SupporterPool.new(rcToken.address);
    instance = await SupporterContract.new(userContract.address, supporterPool.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(ownerAddress);
    await supporterPool.newAllowedCaller(instance.address);
    await rcToken.addContractPool(supporterPool.address, 0);
  });

  describe("#addSupporter", () => {
    context("when supporter exists", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", inv1Address);
        await expectRevert(addSupporter("Supporter A", inv1Address), "This supporter already exist");
      });
    });

    context("when supporter don't exist", () => {
      it("create supporter", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);
        const supporter = await instance.getSupporter(inv1Address);

        assert.equal(supporter.supporterWallet, inv1Address);
      });

      it("increment supporterCount", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);
        const supportersCount = await instance.supportersCount();

        assert.equal(supportersCount, 2);
      });

      it("add created supporter in supporterList", async () => {
        await addSupporter("Supporter A", inv1Address);
        await addSupporter("Supporter B", inv2Address);

        const supporters = await instance.getSupporters();

        assert.equal(supporters[0].supporterWallet, inv1Address);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", inv1Address);

        const userType = await userContract.getUser(inv1Address);
        const SUPPORTER = 7;

        assert.equal(userType, SUPPORTER);
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

        assert.equal(supporters.length, 2);
      });
    });

    context("when dont have supporters", () => {
      it("return empty supporters array", async () => {
        const supporters = await instance.getSupporters();

        assert.equal(supporters.length, 0);
      });
    });
  });

  describe("#getSupporter", () => {
    it("return a supporter", async () => {
      await addSupporter("Supporter A", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      assert.equal(supporter.supporterWallet, inv1Address);
    });
  });

  context("#supporterExists", () => {
    context("when supporter exists", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", inv1Address);
      });

      it("return true", async () => {
        const supporterExists = await instance.supporterExists(inv1Address);

        assert.equal(supporterExists, true);
      });
    });

    context("when supporter dont exists", () => {
      it("return false", async () => {
        const supporterExists = await instance.supporterExists(inv1Address);

        assert.equal(supporterExists, false);
      });
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
              await instance.burnTokens(1000000000000000000n, { from: inv2Address });
            });

            it("Supporter balance must be 99000000000000000000", async () => {
              const balance = await supporterPool.balanceOf(inv2Address);
              assert.equal(balance, 99000000000000000000n);
            });

            it("Supporter inviter balance must be 10000000000000000", async () => {
              const balance = await supporterPool.balanceOf(inv1Address);
              assert.equal(balance, 10000000000000000n);
            });

            it("totalCertified must be 990000000000000000", async () => {
              const totalCertified = await rcToken.totalCertified();
              assert.equal(totalCertified, 990000000000000000n);
            });
          });

          context("when burn 500000000000000000 tokens", () => {
            beforeEach(async () => {
              await instance.burnTokens(500000000000000000n, { from: inv2Address });
            });

            it("Supporter balance must be 99500000000000000000", async () => {
              const balance = await supporterPool.balanceOf(inv2Address);
              assert.equal(balance, 99500000000000000000n);
            });

            it("Supporter inviter balance must be 5000000000000000", async () => {
              const balance = await supporterPool.balanceOf(inv1Address);
              assert.equal(balance, 5000000000000000n);
            });

            it("totalCertified must be 495000000000000000", async () => {
              const totalCertified = await rcToken.totalCertified();
              assert.equal(totalCertified, 495000000000000000n);
            });
          });
        });

        context("when SUPPORTER wasn't invited", () => {
          beforeEach(async () => {
            await transferTokensTo(inv1Address, "100000000000000000000");
          });

          context("when burn 1000000000000000000 tokens", () => {
            beforeEach(async () => {
              await instance.burnTokens(1000000000000000000n, { from: inv1Address });
            });

            it("Supporter balance must be 99000000000000000000", async () => {
              const supporterBalance = await supporterPool.balanceOf(inv1Address);

              assert.equal(supporterBalance, 99000000000000000000n);
            });

            it("totalCertified must be 1000000000000000000", async () => {
              const totalCertified = await rcToken.totalCertified();

              assert.equal(totalCertified, 1000000000000000000n);
            });
          });

          context("when burn 500000000000000000 tokens", () => {
            beforeEach(async () => {
              await instance.burnTokens(500000000000000000n, { from: inv1Address });
            });

            it("Supporter balance must be 99500000000000000000", async () => {
              const supporterBalance = await supporterPool.balanceOf(inv1Address);

              assert.equal(supporterBalance, 99500000000000000000n);
            });

            it("totalCertified must be 500000000000000000", async () => {
              const totalCertified = await rcToken.totalCertified();

              assert.equal(totalCertified, 500000000000000000n);
            });
          });
        });
      });

      context("when amount is equal zero", () => {
        it("should return error", async () => {
          await expectRevert(instance.burnTokens(0, { from: inv1Address }), "Amount invalid");
        });
      });
    });

    context("when msg.sender is not SUPPORTER", () => {
      it("should return error", async () => {
        await expectRevert(instance.burnTokens(1, { from: inv1Address }), "Only supporters");
      });
    });
  });
});
