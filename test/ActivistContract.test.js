const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");

describe("ActivistContract", () => {
  let instance, userContract, activistPool, regenerationCredit;
  let owner, activ1Address, activ2Address, activ3Address, producer1Address, inspector1Address, inspector2Address;

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  const addActivist = async (name, from) => {
    await instance.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, activ1Address, activ2Address, activ3Address, producer1Address, inspector1Address, inspector2Address] =
      await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    userContract = await userContractDeployed();

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      regenerationCredit.target,
      activistPoolArgs.halving,
      activistPoolArgs.totalEras,
      activistPoolArgs.blocksPerEra
    );

    const instanceContractFactory = await ethers.getContractFactory("ActivistContract");
    instance = await instanceContractFactory.deploy(userContract.target, activistPool.target);

    await userContract.newAllowedCaller(activ1Address);
    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);

    await activistPool.newAllowedCaller(instance.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(activistPool.target, activistPoolArgs.totalTokens);
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
          await expect(addActivist("Activist A", activ1Address)).to.be.revertedWith("User already exists");
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
          const activistsCount = await userContract.userTypesCount(userTypes.Activist);

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

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when activist is registered", () => {
        beforeEach(async () => {
          await addActivist("Activist A", activ1Address);

          await addInvitation(activ1Address, producer1Address, userTypes.Producer, activ1Address);
          await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

          await instance.addLevel(producer1Address, 3, inspector1Address, 3);
        });

        context("when current era of pool is 1", () => {
          it("add level to activist.pool.level ", async () => {
            const activist = await instance.getActivist(activ1Address);

            expect(activist.pool.level).to.equal(2);
          });

          it("add level to activisPool", async () => {
            const eraLevels = await activistPool.eraLevels(1, activ1Address);

            expect(eraLevels).to.equal(2);
          });
        });

        context("when current era of pool is 2", () => {
          beforeEach(async () => {
            await advanceBlock(activistPoolArgs.blocksPerEra);

            await addInvitation(activ1Address, inspector2Address, userTypes.Inspector, activ1Address);

            await instance.addLevel(producer1Address, 3, inspector2Address, 3);
          });

          it("add level to activist.pool.level ", async () => {
            const activist = await instance.getActivist(activ1Address);

            expect(activist.pool.level).to.equal(3);
          });

          it("add level to era 2 activisPool", async () => {
            const eraLevels = await activistPool.eraLevels(2, activ1Address);

            expect(eraLevels).to.equal(1);
          });
        });
      });

      context("when activist is not registered", () => {
        beforeEach(async () => {
          await addInvitation(activ1Address, producer1Address, userTypes.Producer, activ1Address);
          await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

          await instance.addLevel(producer1Address, 3, inspector1Address, 3);
        });

        it("do not add level to activist.pool.level ", async () => {
          const activist = await instance.getActivist(activ1Address);

          expect(activist.pool.level).to.equal(0);
        });

        it("do not add level to activisPool", async () => {
          const eraLevels = await activistPool.eraLevels(1, activ1Address);

          expect(eraLevels).to.equal(0);
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(
          instance.connect(activ1Address).addLevel(producer1Address, 1, activ1Address, 1)
        ).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a activist", () => {
      beforeEach(async () => {
        await addActivist("Activist A", activ1Address);
      });

      context("when is era 1", () => {
        context("when activist have levels", () => {
          beforeEach(async () => {
            await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

            await instance.addLevel(producer1Address, 0, inspector1Address, 3);
          });

          it("should return error message", async () => {
            await expect(instance.connect(activ1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
          });
        });
      });

      context("when is era 2", () => {
        context("when activist have levels", () => {
          beforeEach(async () => {
            await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

            await instance.addLevel(producer1Address, 0, inspector1Address, 3);
          });

          context("when have one activist", () => {
            beforeEach(async () => {
              await advanceBlock(activistPoolArgs.blocksPerEra);

              await instance.connect(activ1Address).withdraw();
            });

            it("activist to era 2", async () => {
              const activist = await instance.getActivist(activ1Address);

              expect(activist.pool.currentEra).to.equal(2);
            });

            it("activist balance must be", async () => {
              const balance = await regenerationCredit.balanceOf(activ1Address);

              expect(balance).to.equal(1250000000000000000000000n);
            });
          });

          context("when have two activist", () => {
            beforeEach(async () => {
              await addActivist("Activist B", activ3Address);

              await userContract.newAllowedCaller(activ3Address);
              await addInvitation(activ3Address, inspector2Address, userTypes.Inspector, activ3Address);

              await instance.addLevel(producer1Address, 0, inspector2Address, 3);

              await advanceBlock(activistPoolArgs.blocksPerEra);

              await instance.connect(activ1Address).withdraw();
              await instance.connect(activ3Address).withdraw();
            });

            it("activist1 to era 2", async () => {
              const activist = await instance.getActivist(activ1Address);

              expect(activist.pool.currentEra).to.equal(2);
            });

            it("activist1 balance must be", async () => {
              const balance = await regenerationCredit.balanceOf(activ1Address);

              expect(balance).to.equal(625000000000000000000000n);
            });

            it("activist3 to era 2", async () => {
              const activist = await instance.getActivist(activ3Address);

              expect(activist.pool.currentEra).to.equal(2);
            });

            it("activist3 balance must be", async () => {
              const balance = await regenerationCredit.balanceOf(activ3Address);

              expect(balance).to.equal(625000000000000000000000n);
            });
          });
        });

        context("when activist do not have levels", () => {
          context("when have one activist", () => {
            beforeEach(async () => {
              await advanceBlock(activistPoolArgs.blocksPerEra);

              await instance.connect(activ1Address).withdraw();
            });

            it("activist to era 2", async () => {
              const activist = await instance.getActivist(activ1Address);

              expect(activist.pool.currentEra).to.equal(2);
            });

            it("activist balance must be", async () => {
              const balance = await regenerationCredit.balanceOf(activ1Address);

              expect(balance).to.equal(0n);
            });
          });
        });
      });
    });

    context("when is not a activist", () => {
      it("should return error message", async () => {
        await expect(instance.withdraw()).to.be.revertedWith("Pool only to activist");
      });
    });
  });

  describe("#removePoolLevels", () => {
    beforeEach(async () => {
      await addActivist("Activist  A", activ1Address);

      await addInvitation(activ1Address, producer1Address, userTypes.Producer, owner);
      await addInvitation(activ1Address, inspector2Address, userTypes.Inspector, owner);

      await instance.addLevel(producer1Address, 3, inspector2Address, 3);

      await instance.removePoolLevels(activ1Address, 1);
    });

    it("remove user levels from pool", async () => {
      const levelsEra1 = await activistPool.eraLevels(1, activ1Address);

      expect(levelsEra1).to.equal(1);
    });

    it("remove user levels from activist", async () => {
      const activist = await instance.getActivist(activ1Address);

      expect(activist.pool.level).to.equal(1);
    });
  });
});
