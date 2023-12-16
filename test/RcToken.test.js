const RcToken = artifacts.require("RcToken");
const RcTokenIco = artifacts.require("RcTokenIco");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const ProducerPool = artifacts.require("ProducerPool");

const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");

contract("RcToken", (accounts) => {
  let instance;
  let rcTokenIco;
  let [ownerAddress, user1Address, user2Address] = accounts;
  let producerPool;

  let args = {
    totalRcTokens: "1500000000000000000000000000",
  };

  const argsProducerPool = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    rcTokenIco = await RcTokenIco.new();

    instance = await RcToken.new(args.totalRcTokens, rcTokenIco.address);
    userContract = await userContractDeployed();

    producerPool = await ProducerPool.new(
      instance.address,
      argsProducerPool.halving,
      argsProducerPool.totalEras,
      argsProducerPool.blocksPerEra
    );

    await rcTokenIco.setRcToken(instance.address);
  });

  describe(".afterDeploy", () => {
    it("total suply should be equal to 1500000000000000000000000000", async () => {
      const totalSupply = await instance.totalSupply();
      assert.equal(totalSupply, args.totalRcTokens);
    });

    it("totalCertified should be equal zero", async () => {
      const totalCertified = await instance.totalCertified();
      assert.equal(totalCertified, 0);
    });

    it("totalLocked should be equal zero", async () => {
      const totalLocked = await instance.totalLocked();
      assert.equal(totalLocked, 0);
    });

    it("balance of contract owner should be equal to 1365000000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      assert.equal(ownerBalance, 1365000000000000000000000000n);
    });

    it("balance of rcTokenIco should be 135000000000000000000000000", async () => {
      const balance = await instance.balanceOf(rcTokenIco.address);
      assert.equal(balance, 135000000000000000000000000n);
    });
  });

  describe("#transfer", () => {
    context("when user have tokens", () => {
      context("when a user transfer 100000000000000000000 sac token", () => {
        it("it should transfer when user has tokens", async () => {
          await instance.transfer(user1Address, "100000000000000000000");
          const balanceOf = await instance.balanceOf(user1Address);
          assert.equal(balanceOf, "100000000000000000000");
        });
      });
    });

    context("when user doesn't have tokens", () => {
      it("must return erro message", async () => {
        await expectRevert(
          instance.transfer(user1Address, "100000000000000000000", {
            from: user2Address,
          }),
          "Insufficient balance."
        );
      });
    });
  });

  describe("#burnTokens", () => {
    context("when user have tokens", () => {
      beforeEach(async () => {
        await instance.transfer(user1Address, "200000000000000000000");
        await instance.burnTokens("100000000000000000000", { from: user1Address });
      });

      context("when burn 100000000000000000000 tokens", () => {
        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          assert.equal(burnedTokens, "100000000000000000000");
        });

        it("should add 100000000000000000000 to user certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          assert.equal(userCertificate, "100000000000000000000");
        });

        it("should add 100000000000000000000 to totalCertified", async () => {
          const totalBurned = await instance.totalCertified();

          assert.equal(totalBurned, "100000000000000000000");
        });
      });

      context("when burn another 100000000000000000000 tokens", () => {
        beforeEach(async () => {
          await instance.burnTokens("100000000000000000000", { from: user1Address });
        });

        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          assert.equal(burnedTokens, "0");
        });

        it("should increase 100000000000000000000 tokens to certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          assert.equal(userCertificate, "200000000000000000000");
        });

        it("should increase totalCertified in 100000000000000000000", async () => {
          const totalCertified = await instance.totalCertified();

          assert.equal(totalCertified, "200000000000000000000");
        });
      });
    });

    context("when user does not have tokens", () => {
      it("must return error message", async () => {
        await expectRevert(
          instance.burnTokens("100000000000000000000", { from: user2Address }),
          "Burn amount exceeds balance"
        );
      });
    });
  });

  describe("#burnTokensWith", () => {
    context("when msg.sender is a contractPool", () => {
      beforeEach(async () => {
        await instance.addContractPool(ownerAddress, 0);
        await instance.transfer(user1Address, "200000000000000000000");
        await instance.burnTokensWith(user1Address, "100000000000000000000", { from: ownerAddress });
      });

      it("should burn when has tokens", async () => {
        const burnedTokens = await instance.balanceOf(user1Address);

        assert.equal(burnedTokens, "100000000000000000000");
      });
    });

    context("when msg.sender is not a contractPool", () => {
      it("should return error", async () => {
        await expectRevert(instance.burnTokensWith(user1Address, 100, { from: ownerAddress }), "Not a contract pool");
      });
    });
  });

  describe("#totalLocked", () => {
    context("when add contract pool", () => {
      beforeEach(async () => {
        await instance.addContractPool(producerPool.address, argsProducerPool.totalTokens);
      });

      it("it should set totalLocked to 750000000000000000000000000", async () => {
        const totalLocked = await instance.totalLocked();
        assert.equal(totalLocked, 750000000000000000000000000);
      });
    });
  });
});
