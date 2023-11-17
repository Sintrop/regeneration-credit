const SupporterContract = artifacts.require("SupporterContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("SupporterContract", (accounts) => {
  let instance;
  let userContract;
  let [ownerAddress, inv1Address, inv2Address] = accounts;

  const addSupporter = async (name, address) => {
    await instance.addSupporter(name, { from: address });
  };

  beforeEach(async () => {
    userContract = await userContractDeployed();

    instance = await SupporterContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
  });

  context("when will create new supporter (.addSupporter)", () => {
    context("when supporter exists", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", inv1Address);
        await expectRevert(addSupporter("Supporter A", inv1Address), "This supporter already exist");
      });

      context("when supporter don't exist", () => {
        it("should create supporter", async () => {
          await addSupporter("Supporter A", inv1Address);
          await addSupporter("Supporter B", inv2Address);
          const supporter = await instance.getSupporter(inv1Address);

          assert.equal(supporter.supporterWallet, inv1Address);
        });

        it("should increment supporterCount after create supporter", async () => {
          await addSupporter("Supporter A", inv1Address);
          await addSupporter("Supporter B", inv2Address);
          const supportersCount = await instance.supportersCount();

          assert.equal(supportersCount, 2);
        });

        it("should add create supporter in supporterList (array)", async () => {
          await addSupporter("Supporter A", inv1Address);
          await addSupporter("Supporter B", inv2Address);

          const supporters = await instance.getSupporters();

          assert.equal(supporters[0].supporterWallet, inv1Address);
        });

        it("should add created supporter in userType contract as a SUPPORTER", async () => {
          await addSupporter("Supporter A", inv1Address);

          const userType = await userContract.getUser(inv1Address);
          const SUPPORTER = 7;

          assert.equal(userType, SUPPORTER);
        });
      });
    });
  });

  context("when will get supporters (.getSupporters)", () => {
    it("should return supporters when has supporters", async () => {
      await addSupporter("Supporter A", inv1Address);
      await addSupporter("Supporter B", inv2Address);

      const supporters = await instance.getSupporters();

      assert.equal(supporters.length, 2);
    });

    it("should return supporters equal zero when don't have it", async () => {
      const supporters = await instance.getSupporters();

      assert.equal(supporters.length, 0);
    });
  });

  context("when will get supporter (.getSupporter)", () => {
    it("should return a supporter", async () => {
      await addSupporter("Supporter A", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      assert.equal(supporter.supporterWallet, inv1Address);
    });
  });

  context("when will check if supporter exists", () => {
    it("should return true when exists", async () => {
      await addSupporter("Supporter A", inv1Address);
      const supporterExists = await instance.supporterExists(inv1Address);

      assert.equal(supporterExists, true);
    });

    it("it should return false when don't exist", async () => {
      const supporterExists = await instance.supporterExists(inv1Address);

      assert.equal(supporterExists, false);
    });
  });
});
