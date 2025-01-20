const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupporterPool", () => {
  let instance, regenerationCredit;
  let owner, user1Address, user2Address;

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    const instanceFactory = await ethers.getContractFactory("SupporterPool");
    instance = await instanceFactory.deploy(regenerationCredit.target);

    await instance.newAllowedCaller(owner);

    await regenerationCredit.addContractPool(instance.target, 0);
  });

  describe("#burnTokens", () => {
    beforeEach(async () => {
      await transferTokensTo(user1Address, "100000000000000000000");
    });

    context("when user was invited", () => {
      beforeEach(async () => {
        receipt = await instance.burnTokens(user1Address, user2Address, "950000000000000000", "50000000000000000");
      });

      it("user1Address balance must be 99000000000000000000", async () => {
        const balance = await instance.balanceOf(user1Address);
        expect(balance).to.equal(99000000000000000000n);
      });

      it("user2Address balance must be 50000000000000000", async () => {
        const balance = await instance.balanceOf(user2Address);
        expect(balance).to.equal(50000000000000000n);
      });

      it("totalCertified must be 950000000000000000", async () => {
        const totalCertified = await regenerationCredit.totalCertified();
        expect(totalCertified).to.equal(950000000000000000n);
      });

      it("send PoolBurnTokensEvent", async () => {
        await expect(receipt)
          .to.emit(instance, "PoolBurnTokensEvent")
          .withArgs(user1Address.address, 950000000000000000n, user2Address.address, 50000000000000000n);
      });
    });

    context("when user was not invited", () => {
      beforeEach(async () => {
        receipt = await instance.burnTokens(user1Address, user2Address, "1000000000000000000", 0);
      });

      it("user1Address balance must be 99000000000000000000", async () => {
        const balance = await instance.balanceOf(user1Address);
        expect(balance).to.equal(99000000000000000000n);
      });

      it("user2Address balance must be 0", async () => {
        const balance = await instance.balanceOf(user2Address);
        expect(balance).to.equal(0);
      });

      it("totalCertified must be 1000000000000000000", async () => {
        const totalCertified = await regenerationCredit.totalCertified();
        expect(totalCertified).to.equal(1000000000000000000n);
      });

      it("send PoolBurnTokensEvent", async () => {
        await expect(receipt)
          .to.emit(instance, "PoolBurnTokensEvent")
          .withArgs(user1Address.address, 1000000000000000000n, user2Address.address, 0n);
      });
    });
  });
});
