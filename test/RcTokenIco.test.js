const { expect } = require("chai");
const { ethers } = require("hardhat");
const { advanceBlock } = require("./shared/advance_block");

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
        await advanceBlock(100);
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

          expect(balance).to.equal(120000000000000000000000n);
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

          expect(balance).to.equal(120000000000000000000n);
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

        it("user rc token balance increment 240000000000000000000000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          expect(balance).to.equal(240000000000000000000000n);
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

          expect(balance).to.equal(720000000000000000000000n);
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

    context("when the sales is not open yet", () => {
      it("it return erro message", async () => {
        await expect(sendTransation(user1Address, instance.target, 1)).to.be.revertedWith("ICO: sales is not open yet");
      });
    });

    context("when the sales is not open anymore", () => {
      it("it return erro message", async () => {
        await advanceBlock(10000);
        await expect(sendTransation(user1Address, instance.target, 1)).to.be.revertedWith(
          "ICO: sales is not open anymore"
        );
      });
    });
  });

  describe("#balance", () => {
    it("should return the contract balance", async () => {
      const balance = await instance.balance();

      expect(balance).to.equal(0);
    });
  });

  describe("#withdraw", () => {
    context("when is the owner", () => {
      context("when sold 1 ether", () => {
        beforeEach(async () => {
          await advanceBlock(100);
          sendTransation(user1Address, instance.target, 1);
        });

        context("when the owner withdraw", () => {
          beforeEach(async () => {
            balanceBefore = await ethers.provider.getBalance(ownerAddress);

            await instance.withdraw(1000000000000000000n);

            balanceAfter = await await ethers.provider.getBalance(ownerAddress);
          });

          it("should increment owner ether balance", async () => {
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

    context("when not the owner withdraw", () => {
      it("it should return error message", async () => {
        await expect(instance.connect(user1Address).withdraw(1000000000000000000n)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
    });
  });

  describe("#withdrawTokens", () => {
    context("when is the owner", () => {
      context("when contract have rcTokens", () => {
        context("when withdraw total amount", () => {
          beforeEach(async () => {
            balanceBeforeRc = await rcToken.balanceOf(ownerAddress);

            await instance.withdrawRcToken(124500000000000000000000000n);

            balanceAfterRc = await rcToken.balanceOf(ownerAddress);
          });

          it("should increment owner rc balance", async () => {
            expect(parseInt(balanceAfterRc)).to.above(parseInt(balanceBeforeRc));
          });

          it("should decrement contract rc balance", async () => {
            contractRcBalance = await rcToken.balanceOf(instance);
            expect(contractRcBalance).to.equal(0);
          });
        });
      });

      context("when sold 1 ether", () => {
        beforeEach(async () => {
          await advanceBlock(100);
          sendTransation(user1Address, instance.target, 1);
        });

        context("when the owner withdraw", () => {
          beforeEach(async () => {
            balanceBeforeRc = await rcToken.balanceOf(ownerAddress);

            await instance.withdrawRcToken(80000000000000000000000n);

            balanceAfterRc = await rcToken.balanceOf(ownerAddress);
          });

          it("should increment owner rc balance", async () => {
            expect(parseInt(balanceAfterRc)).to.above(parseInt(balanceBeforeRc));
          });

          it("should decrement contract rc balance", async () => {
            contractRcBalance = await rcToken.balanceOf(instance);
            expect(contractRcBalance).to.equal(124180000000000000000000000n);
          });
        });
      });
    });

    context("when ICO contract dont have enough tokens", () => {
      it("it should return error message", async () => {
        await expect(instance.withdrawRcToken(136000000000000000000000000n)).to.be.revertedWith(
          "Insufficient balance."
        );
      });
    });

    context("when not the owner withdraw", () => {
      it("it should return error message", async () => {
        await expect(instance.connect(user1Address).withdraw(80000000000000000000000n)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
    });
  });
});
