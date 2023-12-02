const ActivistContract = artifacts.require("ActivistContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ActivistContract", (accounts) => {
  let instance;
  let userContract;
  let [owner, contr1Address, contr2Address, contr3Address] = accounts;

  const addActivist = async (name, address) => {
    await instance.addActivist(name, "photoURL", { from: address });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  beforeEach(async () => {
    userContract = await userContractDeployed();

    instance = await ActivistContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(owner);

    await addInvitation(owner, contr1Address, userTypes.Activist, owner);
    await addInvitation(owner, contr3Address, userTypes.Activist, owner);
  });

  context("when will create new activist (.addActivist)", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addActivist("Activist B", contr2Address), "Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when activist exists", () => {
        it("should return error", async () => {
          await addActivist("Activist A", contr1Address);
          await expectRevert(addActivist("Activist A", contr1Address), "This activist already exist");
        });
      });

      context("when activist don't exist", () => {
        it("should create activist", async () => {
          await addActivist("Activist A", contr1Address);
          await addActivist("Activist C", contr3Address);
          const activist = await instance.getActivist(contr1Address);

          assert.equal(activist.activistWallet, contr1Address);
        });

        it("should increment activistCount after create activist", async () => {
          await addActivist("Activist A", contr1Address);
          await addActivist("Activist C", contr3Address);
          const activistsCount = await instance.activistsCount();

          assert.equal(activistsCount, 2);
        });

        it("should add created activist in activistList (array)", async () => {
          await addActivist("Activist A", contr1Address);
          await addActivist("Activist C", contr3Address);

          const activists = await instance.getActivists();

          assert.equal(activists[0].activistWallet, contr1Address);
        });

        it("should add created activist in userType contract as a ACTIVIST", async () => {
          await addActivist("Activist A", contr1Address);

          const userType = await userContract.getUser(contr1Address);
          const ACTIVIST = 6;

          assert.equal(userType, ACTIVIST);
        });
      });
    });
  });

  context("when will get activists (.getActivists)", () => {
    it("should return activists when has activists", async () => {
      await addActivist("Activist A", contr1Address);
      await addActivist("Activist C", contr3Address);

      const activists = await instance.getActivists();

      assert.equal(activists.length, 2);
    });

    it("should return activists equal zero when dont has it", async () => {
      const activists = await instance.getActivists();

      assert.equal(activists.length, 0);
    });
  });

  context("when will get activist (.getActivist)", () => {
    it("should return a activist", async () => {
      await addActivist("Activist A", contr1Address);

      const activist = await instance.getActivist(contr1Address);

      assert.equal(activist.activistWallet, contr1Address);
    });
  });

  context("when will check if activist exists", () => {
    it("should return true when exists", async () => {
      await addActivist("Activist A", contr1Address);
      const activistExists = await instance.activistExists(contr1Address);

      assert.equal(activistExists, true);
    });

    it("it should return false when don't exist", async () => {
      const activistExists = await instance.activistExists(contr1Address);

      assert.equal(activistExists, false);
    });
  });
});
