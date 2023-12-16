const SupporterPool = artifacts.require("SupporterPool");

const expectEvent = require("@openzeppelin/test-helpers").expectEvent;
const { rcTokenDeployed } = require("./shared/rc_token_deployed");

contract("SupporterPool", (accounts) => {
  let instance, rcToken;
  let [owner, user1Address, user2Address] = accounts;

  const transferTokensTo = async (userAddress, tokens) => {
    await rcToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    rcToken = await rcTokenDeployed();
    instance = await SupporterPool.new(rcToken.address);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.address, 0);
  });

  describe("#burnTokens", () => {
    beforeEach(async () => {
      await transferTokensTo(user1Address, "100000000000000000000");
    });

    context("when user was invited", () => {
      beforeEach(async () => {
        receipt = await instance.burnTokens(user1Address, user2Address, "1000000000000000000", true);
      });

      it("user1Address balance must be 99000000000000000000", async () => {
        const balance = await instance.balanceOf(user1Address);
        assert.equal(balance, 99000000000000000000n);
      });

      it("user2Address balance must be 10000000000000000", async () => {
        const balance = await instance.balanceOf(user2Address);
        assert.equal(balance, 10000000000000000n);
      });

      it("totalCertified must be 990000000000000000", async () => {
        const totalCertified = await rcToken.totalCertified();
        assert.equal(totalCertified, 990000000000000000n);
      });

      it("send PoolBurnTokensEvent", async () => {
        expectEvent(receipt, "PoolBurnTokensEvent", {
          _tokenOwner: user1Address,
          _amountSend: web3.utils.toBN("1000000000000000000"),
          _amountBurned: web3.utils.toBN("990000000000000000"),
          _inviter: user2Address,
          _inviterTotalTokens: web3.utils.toBN("10000000000000000"),
        });
      });
    });

    context("when user was not invited", () => {
      beforeEach(async () => {
        receipt = await instance.burnTokens(user1Address, user2Address, "1000000000000000000", false);
      });

      it("user1Address balance must be 99000000000000000000", async () => {
        const balance = await instance.balanceOf(user1Address);
        assert.equal(balance, 99000000000000000000n);
      });

      it("user2Address balance must be 0", async () => {
        const balance = await instance.balanceOf(user2Address);
        assert.equal(balance, 0);
      });

      it("totalCertified must be 1000000000000000000", async () => {
        const totalCertified = await rcToken.totalCertified();
        assert.equal(totalCertified, 1000000000000000000n);
      });

      it("send PoolBurnTokensEvent", async () => {
        expectEvent(receipt, "PoolBurnTokensEvent", {
          _tokenOwner: user1Address,
          _amountSend: web3.utils.toBN("1000000000000000000"),
          _amountBurned: web3.utils.toBN("1000000000000000000"),
          _inviter: user2Address,
          _inviterTotalTokens: web3.utils.toBN(0),
        });
      });
    });
  });
});
