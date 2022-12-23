const SacToken = artifacts.require("SacToken");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");

contract("SacToken", (accounts) => {
  let instance;
  let userContract;
  let [ownerAddress, user1Address, user2Address] = accounts;

  let args = {
    totalSacTokens: "1500000000000000000000000000",
  };

  beforeEach(async () => {
    instance = await SacToken.new(args.totalSacTokens);
    userContract = await UserContract.new();
  });

  context("when deploy the token contract", () => {
    it("total suply should be equal to 1500000000000000000000000000", async () => {
      const totalSupply = await instance.totalSupply();
      assert.equal(totalSupply, args.totalSacTokens);
    });

    it("balance of contract owner should be equal to 1500000000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      assert.equal(ownerBalance, args.totalSacTokens);
    });
  });

  describe("#transfer", () => {
    context("when a user transfer 100000000000000000000 sac token", () => {
      it("it should transfer when user has tokens", async () => {
        await instance.transfer(user1Address, 100000000000000000000);
        const balanceOf = await instance.balanceOf(user1Address);
        assert.equal(balanceOf, 100000000000000000000);
      });

      it("it should not transfer when user has no tokens", async () => {
        await expectRevert(
          instance.transfer(user1Address, 100000000000000000000, { from: user2Address }),
          "Insufficient balance."
        );
      });
    });
  });

  describe("#burnTokens", () => {
    context("when a user try to burn 100000000000000000000 tokens", () => {
      it("should burn when has tokens", async () => {
        await instance.transfer(user1Address, 200000000000000000000);
        await instance.burnTokens(100000000000000000000, { from: user1Address });
        const burnedTokens = await instance.balanceOf(user1Address);

        assert.equal(burnedTokens, "100000000000000000000");
      });

      it("should not burn when don't have tokens", async () => {
        await expectRevert(
          instance.burnTokens(100000000000000000000, { from: user1Address }),
          "Burn amount exceeds balance"
        );
      });
    });
  });
});
