const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RcTokenIco", () => {
  let instance;
  let rcToken, rcTokenIco;
  let ownerAddress, user1Address;

  let args = {
    totalRcTokens: "1500000000000000000000000000",
  };

  const sendTransation = async (from, to, tokensEthers) => {
    await from.sendTransaction({
      to: to,
      value: ethers.parseEther(`${tokensEthers}`),
    });
  };

  beforeEach(async () => {
    [ownerAddress, user1Address] = await ethers.getSigners();

    const instanceFactory = await ethers.getContractFactory("RcTokenIco");
    instance = await instanceFactory.deploy();

    const rcTokenFactory = await ethers.getContractFactory("RcToken");
    rcToken = await rcTokenFactory.deploy(args.totalRcTokens, instance.target);

    instance.setRcToken(rcToken.target);
  });

  describe("#receive", () => {
    context("when the sales is open", () => {
      beforeEach(async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
      });

      context("when user send 0.5 ether", () => {
        beforeEach(async () => {
          await sendTransation(user1Address, instance.target, 0.5);
        });

        it("contract ether balance increment 0.5 ether", async () => {
          const balance = await ethers.provider.getBalance(instance.target);

          expect(balance).to.equal(500000000000000000n);
        });

        it("user rc token balance increment 40000000000000000000000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(40000000000000000000000n);
        });
      });

      context("when user send 0.0005 ether", () => {
        beforeEach(async () => {
          await sendTransation(user1Address, instance.target, 0.0005);
        });

        it("contract ether balance increment 0.0005 ether", async () => {
          const balance = await ethers.provider.getBalance(instance.target);

          expect(balance).to.equal(500000000000000n);
        });

        it("user rc token balance increment 40000000000000000000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(40000000000000000000n);
        });
      });

      context("when user send 1 ether", () => {
        beforeEach(async () => {
          await sendTransation(user1Address, instance.target, 1);
        });

        it("contract ether balance increment 1 ether", async () => {
          const balance = await ethers.provider.getBalance(instance.target);

          expect(balance).to.equal(1000000000000000000n);
        });

        it("user rc token balance increment 80000000000000000000000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(80000000000000000000000n);
        });
      });

      context("when user send 3 tokens", () => {
        beforeEach(async () => {
          await sendTransation(user1Address, instance.target, 3);
        });

        it("contract ether balance increment 3 ether", async () => {
          const balance = await ethers.provider.getBalance(instance.target);

          expect(balance).to.equal(3000000000000000000n);
        });

        it("user rc token balance increment 240000000000000000000000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(240000000000000000000000n);
        });
      });

      context("when the user send 0 ether", () => {
        beforeEach(async () => {
          await sendTransation(user1Address, instance.target, 0);
        });

        it("contract ether balance increment 0 ether", async () => {
          const balance = await ethers.provider.getBalance(instance.target);

          expect(balance).to.equal(0);
        });

        it("user rc token balance increment 0", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(0);
        });
      });
    });

    context("when the sales is not open", () => {
      it("it return erro message", async () => {
        await expect(sendTransation(user1Address, instance.target, 1)).to.be.revertedWith("ICO: sales not open");
      });
    });
  });

  describe("#balance", () => {
    it("should return the contract balance", async () => {
      const balance = await instance.balance();

      expect(balance).to.equal(0);
    });
  });

  describe("#changeSalesOpen", () => {
    context("when the sales is open", () => {
      beforeEach(async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
      });

      it("should change the sales status to false", async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
        const salesOpen = await instance.salesOpen();

        expect(salesOpen).to.equal(false);
      });
    });

    context("when the sales is not open", () => {
      beforeEach(async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
      });

      it("should change the sales status to true", async () => {
        const salesOpen = await instance.salesOpen();

        expect(salesOpen).to.equal(true);
      });
    });
  });

  describe("#withdraw", () => {
    context("when ICO contract have ether", () => {
      context("when have 1 ether", () => {
        beforeEach(async () => {
          await instance.changeSalesOpen({ from: ownerAddress });
          sendTransation(user1Address, instance.target, 1);
        });

        context("when the owner withdraw 1 ether", () => {
          beforeEach(async () => {
            balanceBefore = await ethers.provider.getBalance(ownerAddress);

            await instance.withdraw(1000000000000000000n);

            balanceAfter = await await ethers.provider.getBalance(ownerAddress);
          });

          it("increment owner ether balance", async () => {
            expect(parseInt(balanceAfter)).to.above(parseInt(balanceBefore));
          });
        });
      });
    });

    context("when ICO contract dont have ether", () => {
      it("it should return erro message", async () => {
        await expect(instance.withdraw(1000000000000000000n)).to.be.revertedWith("ICO: insufficient balance");
      });
    });
  });
});
