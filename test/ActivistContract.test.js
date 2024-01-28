const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("ActivistContract", () => {
  let instance;
  let userContract;
  let owner, activ1Address, activ2Address, activ3Address;

  const addActivist = async (name, from) => {
    await instance.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, activ1Address, activ2Address, activ3Address] = await ethers.getSigners();

    userContract = await userContractDeployed();

    const instanceContractFactory = await ethers.getContractFactory("ActivistContract");

    instance = await instanceContractFactory.deploy(userContract.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);

    await addInvitation(owner, activ1Address, userTypes.Activist, owner);
    await addInvitation(owner, activ3Address, userTypes.Activist, owner);
  });

  context("when will create new activist (.addActivist)", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addActivist("Activist B", activ2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when activist exists", () => {
        it("should return error", async () => {
          await addActivist("Activist A", activ1Address);
          await expect(addActivist("Activist A", activ1Address)).to.be.revertedWith("This activist already exist");
        });
      });

      context("when activist don't exist", () => {
        it("should create activist", async () => {
          await addActivist("Activist A", activ1Address);
          await addActivist("Activist C", activ3Address);
          const activist = await instance.getActivist(activ1Address);

          expect(activist.activistWallet).to.equal(activ1Address.address);
        });

        it("should increment activistCount after create activist", async () => {
          await addActivist("Activist A", activ1Address);
          await addActivist("Activist C", activ3Address);
          const activistsCount = await instance.activistsCount();

          expect(activistsCount).to.equal(2);
        });

        it("should add created activist in activistList (array)", async () => {
          await addActivist("Activist A", activ1Address);
          await addActivist("Activist C", activ3Address);

          const activists = await instance.getActivists();

          expect(activists[0].activistWallet).to.equal(activ1Address.address);
        });

        it("should add created activist in userType contract as a ACTIVIST", async () => {
          await addActivist("Activist A", activ1Address);

          const userType = await userContract.getUser(activ1Address);
          const ACTIVIST = 6;

          expect(userType).to.equal(ACTIVIST);
        });
      });
    });
  });

  context("when will get activists (.getActivists)", () => {
    it("should return activists when has activists", async () => {
      await addActivist("Activist A", activ1Address);
      await addActivist("Activist C", activ3Address);

      const activists = await instance.getActivists();

      expect(activists.length).to.equal(2);
    });

    it("should return activists equal zero when dont has it", async () => {
      const activists = await instance.getActivists();

      expect(activists.length).to.equal(0);
    });
  });

  context("when will get activist (.getActivist)", () => {
    it("should return a activist", async () => {
      await addActivist("Activist A", activ1Address);

      const activist = await instance.getActivist(activ1Address);

      expect(activist.activistWallet).to.equal(activ1Address.address);
    });
  });

  context("when will check if activist exists", () => {
    it("should return true when exists", async () => {
      await addActivist("Activist A", activ1Address);
      const activistExists = await instance.activistExists(activ1Address);

      expect(activistExists).to.equal(true);
    });

    it("it should return false when don't exist", async () => {
      const activistExists = await instance.activistExists(activ1Address);

      expect(activistExists).to.equal(false);
    });
  });
});
