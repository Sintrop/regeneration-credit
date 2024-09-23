const { ethers } = require("hardhat");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { expect } = require("chai");

describe("RegenerationCredit", (accounts) => {
  let instance;
  let regenerationCreditIco;
  let ownerAddress, user1Address, user2Address;
  let producerPool;

  let args = {
    totalRegenerationCredits: "1500000000000000000000000000",
    icoStartsAt: "100",
    icoEndsAt: "1000",
  };

  const argsProducerPool = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [ownerAddress, user1Address, user2Address] = await ethers.getSigners();

    const regenerationCreditIcoFactory = await ethers.getContractFactory("RegenerationCreditIco");
    regenerationCreditIco = await regenerationCreditIcoFactory.deploy(args.icoStartsAt, args.icoEndsAt);

    const instanceFactory = await ethers.getContractFactory("RegenerationCredit");
    instance = await instanceFactory.deploy(args.totalRegenerationCredits, regenerationCreditIco.target);
    userContract = await userContractDeployed();

    const producerPoolFactory = await ethers.getContractFactory("ProducerPool");
    producerPool = await producerPoolFactory.deploy(
      instance.target,
      argsProducerPool.halving,
      argsProducerPool.totalEras,
      argsProducerPool.blocksPerEra
    );

    await regenerationCreditIco.setRegenerationCredit(instance.target);
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

    it("balance of contract owner should be equal to 1375500000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      expect(ownerBalance).to.equal(1375500000000000000000000000n);
    });

    it("balance of regenerationCreditIco should be 135000000000000000000000000", async () => {
      const balance = await instance.balanceOf(regenerationCreditIco.target);
      expect(balance).to.equal(124500000000000000000000000n);
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
          "Insufficient balance."
        );
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
        await instance.connect(ownerAddress).burnTokensWith(user1Address, "100000000000000000000");
      });

      it("should burn when has tokens", async () => {
        const burnedTokens = await instance.balanceOf(user1Address);

        expect(burnedTokens).to.equal("100000000000000000000");
      });
    });

    context("when msg.sender is not a contractPool", () => {
      it("should return error", async () => {
        await expect(instance.connect(ownerAddress).burnTokensWith(user1Address, 100)).to.be.revertedWith(
          "Not a contract pool"
        );
      });
    });
  });

  describe("#totalLocked", () => {
    context("when add contract pool", () => {
      beforeEach(async () => {
        await instance.addContractPool(producerPool.target, argsProducerPool.totalTokens);
      });

      it("it should set totalLocked to 750000000000000000000000000", async () => {
        const totalLocked = await instance.totalLocked();
        expect(totalLocked).to.equal(750000000000000000000000000n);
      });
    });
  });
});
