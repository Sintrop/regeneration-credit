const SacToken = artifacts.require("SacToken");
const InvestorContract = artifacts.require("InvestorContract");
const UserContract = artifacts.require("UserContract");

const { balance } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");

contract("SacToken", (accounts) => {
  let instance;
  let investorContract;
  let userContract;
  let [ownerAddress, user1Address, investor1Address] = accounts;

  let args = {
    totalSacTokens: "1500000000000000000000000000",
  };

  const addInvestor = async (name, address) => {
    await investorContract.addInvestor(
      name,
      { from: address }
    );
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await instance.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    userContract = await UserContract.new();
    investorContract = await InvestorContract.new(userContract.address);
    instance = await SacToken.new(args.totalSacTokens);
  })

  context("", () => {
    it("", async () => {

    });
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

  context("when a user transfer 100 sac token", () => {
    it("it should transfer when user has tokens", async () => {
      await instance.transfer(user1Address, 100);
      const balanceOf = await instance.balanceOf(user1Address);
      assert.equal(balanceOf, 100);
    });

    it("it should not transfer when user has no tokens", async () => {
      await expectRevert(
        instance.transfer(user1Address, 100, { from: investor1Address }),
        "Insufficient balance."
      );
    });
  });

  context("when a user try to burn 50 tokens", () => {
    it("should burn when has tokens", async () => {
      await instance.transfer(user1Address, 100);
      await instance.burnTokens(50, {from: user1Address});      
      const burnedTokens = await instance.balanceOf(user1Address);

      assert.equal(burnedTokens, 50);
    });
  });

});