const SacToken = artifacts.require("SacToken");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");
require('./shared/setup.js');

contract("SacToken", (accounts) => {
  let instance;
  let [ownerAddress, user1Address, user2Address] = accounts;

  let args = {
    totalSacTokens: "1500000000000000000000000000",
  };

  before(async () => {
    instance = await SacToken.new(args.totalSacTokens);
    userContract = await UserContract.new();
  });

  context("when deploy the token contract", () => {
    it("total suply should be equal to 1500000000000000000000000000", async () => {
      const totalSupply = await instance.totalSupply();
      assert.equal(totalSupply, args.totalSacTokens);
    });

    it("totalCertified should be equal zero", async () => {
      const totalCertified = await instance.totalCertified();
      assert.equal(totalCertified, 0);
    });

    it("balance of contract owner should be equal to 1500000000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      assert.equal(ownerBalance, args.totalSacTokens);
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
});
