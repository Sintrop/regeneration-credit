const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { expect } = require("chai");

describe("ActivistContract", () => {
  let instance, userContract, activistPool, rcToken;
  let owner, activ1Address, activ2Address, activ3Address;

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const addActivist = async (name, from) => {
    await instance.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, activ1Address, activ2Address, activ3Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      rcToken.target,
      activistPoolArgs.halving,
      activistPoolArgs.totalEras,
      activistPoolArgs.blocksPerEra
    );

    const instanceContractFactory = await ethers.getContractFactory("ActivistContract");
    instance = await instanceContractFactory.deploy(userContract.target, activistPool.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);

    await activistPool.newAllowedCaller(instance.target);
    await instance.newAllowedCaller(owner);
    await rcToken.addContractPool(activistPool.target, activistPoolArgs.totalTokens);
    await addInvitation(owner, activ1Address, userTypes.Activist, owner);
    await addInvitation(owner, activ3Address, userTypes.Activist, owner);
  });

  describe("#addActivist", () => {
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

        it("should increment activistCount", async () => {
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

  describe("#getActivists", () => {
    context("when have activists", () => {
      beforeEach(async () => {
        await addActivist("Activist A", activ1Address);
        await addActivist("Activist C", activ3Address);
      });

      it("should return activists when has activists", async () => {
        const activists = await instance.getActivists();

        expect(activists.length).to.equal(2);
      });
    });

    context("when do not have activists", () => {
      it("should return activists equal zero when dont has it", async () => {
        const activists = await instance.getActivists();

        expect(activists.length).to.equal(0);
      });
    });
  });

  describe("#getActivist", () => {
    context("when activist is registered", () => {
      beforeEach(async () => {
        await addActivist("Activist A", activ1Address);
      });

      it("should return a activist", async () => {
        const activist = await instance.getActivist(activ1Address);

        expect(activist.activistWallet).to.equal(activ1Address.address);
      });
    });

    context("when activist is registered", () => {
      it("should do not return a activist", async () => {
        const activist = await instance.getActivist(activ1Address);

        expect(activist.id).to.equal(0);
      });
    });
  });

  describe("#activistExists", () => {
    context("when activist is registered", () => {
      beforeEach(async () => {
        await addActivist("Activist A", activ1Address);
      });

      it("should return a activist", async () => {
        const activistExists = await instance.activistExists(activ1Address);

        expect(activistExists).to.equal(true);
      });
    });

    context("when activist is not registered", () => {
      it("should return a activist", async () => {
        const activistExists = await instance.activistExists(activ1Address);

        expect(activistExists).to.equal(false);
      });
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when activist is registered", () => {
        beforeEach(async () => {
          await addActivist("Activist A", activ1Address);
          await instance.addLevel(activ1Address);
        });

        it("add level to activist.pool.level ", async () => {
          const activist = await instance.getActivist(activ1Address);

          expect(activist.pool.level).to.equal(1);
        });

        it("add level to activisPool", async () => {
          const eraLevels = await activistPool.eraLevels(1, activ1Address);

          expect(eraLevels).to.equal(1);
        });
      });

      context("when activist is not registered", () => {
        beforeEach(async () => {
          await instance.addLevel(activ1Address);
        });

        it("add level to activist.pool.level ", async () => {
          const activist = await instance.getActivist(activ1Address);

          expect(activist.pool.level).to.equal(0);
        });

        it("add level to activisPool", async () => {
          const eraLevels = await activistPool.eraLevels(1, activ1Address);

          expect(eraLevels).to.equal(0);
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(activ1Address).addLevel(activ1Address)).to.be.revertedWith("Not allowed caller");
      });
    });
  });
});
