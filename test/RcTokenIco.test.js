const RcToken = artifacts.require("RcToken");
const RcTokenIco = artifacts.require("RcTokenIco");

const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");

contract("RcTokenIco", (accounts) => {
  let instance;
  let rcToken;
  let [ownerAddress, user1Address] = accounts;

  let args = {
    totalRcTokens: "1500000000000000000000000000",
  };

  beforeEach(async () => {
    instance = await RcTokenIco.new();

    rcToken = await RcToken.new(args.totalRcTokens, instance.address);

    instance.setRcToken(rcToken.address);
  });

  describe("#receive", () => {
    context("when the sales is open", () => {
      beforeEach(async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
      });

      context("when user send 1 ether", () => {
        beforeEach(async () => {
          await instance.sendTransaction({ from: user1Address, value: web3.utils.toWei("1".toString(), "ether") });
        });

        it("contract ether balance increment 1 ether", async () => {
          const balance = await web3.eth.getBalance(instance.address);

          assert.equal(balance, web3.utils.toWei("1".toString(), "ether"));
        });

        it("user rc token balance increment 80000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          assert.equal(balance, 80000);
        });
      });

      context("when user send 3 tokens", () => {
        beforeEach(async () => {
          await instance.sendTransaction({ from: user1Address, value: web3.utils.toWei("3".toString(), "ether") });
        });

        it("contract ether balance increment 1 ether", async () => {
          const balance = await web3.eth.getBalance(instance.address);

          assert.equal(balance, web3.utils.toWei("3".toString(), "ether"));
        });

        it("user rc token balance increment 240000", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          assert.equal(balance, 240000);
        });
      });

      context("when the user send 0 ether", () => {
        beforeEach(async () => {
          await instance.sendTransaction({ from: user1Address, value: web3.utils.toWei("0".toString(), "ether") });
        });

        it("contract ether balance increment 1 ether", async () => {
          const balance = await web3.eth.getBalance(instance.address);

          assert.equal(balance, web3.utils.toWei("0".toString(), "ether"));
        });

        it("user rc token balance increment 0", async () => {
          const balance = await rcToken.balanceOf(user1Address);

          assert.equal(balance, 0);
        });
      });
    });

    context("when the sales is not open", () => {
      it("it return erro message", async () => {
        await expectRevert(
          instance.sendTransaction({ from: user1Address, value: web3.utils.toWei("1".toString(), "ether") }),
          "ICO: sales not open"
        );
      });
    });
  });

  describe("#balance", () => {
    it("should return the contract balance", async () => {
      const balance = await instance.balance();

      assert.equal(balance, 0);
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

        assert.isFalse(salesOpen);
      });
    });

    context("when the sales is not open", () => {
      beforeEach(async () => {
        await instance.changeSalesOpen({ from: ownerAddress });
      });

      it("should change the sales status to true", async () => {
        const salesOpen = await instance.salesOpen();

        assert.isTrue(salesOpen);
      });
    });
  });

  describe("#withdraw", () => {
    context("when ICO contract have ether", () => {
      context("when have 1 ether", () => {
        beforeEach(async () => {
          await instance.changeSalesOpen({ from: ownerAddress });
          await instance.sendTransaction({ from: user1Address, value: web3.utils.toWei("1".toString(), "ether") });
        });

        context("when the owner withdraw 1 ether", () => {
          beforeEach(async () => {
            balanceBefore = await web3.eth.getBalance(ownerAddress);

            const weiAmount = web3.utils.toWei("1".toString(), "ether");

            await instance.withdraw(weiAmount, { from: ownerAddress });

            balanceAfter = await web3.eth.getBalance(ownerAddress);
          });

          it("increment owner ether balance", async () => {
            assert.isAbove(parseInt(balanceAfter), parseInt(balanceBefore));
          });
        });
      });
    });

    context("when ICO contract dont have ether", () => {
      it("it should return erro message", async () => {
        await expectRevert(
          instance.withdraw(web3.utils.toWei("1".toString(), "ether"), { from: ownerAddress }),
          "ICO: insufficient balance"
        );
      });
    });
  });
});
