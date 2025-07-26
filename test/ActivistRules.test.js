const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("ActivistRules", () => {
  let instance, communityRules, activistPool, regenerationCredit, instanceContractFactory;
  let owner, activ1Address, activ2Address, activ3Address, regenerator1Address, inspector1Address, inspector2Address;

  const activistPoolArgs = {
    totalTokens: "40000000000000000000000000",
    halving: 12,
    blocksPerEra: 25,
  };

  const addActivist = async (name, from) => {
    await instance.connect(from).addActivist(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, activ1Address, activ2Address, activ3Address, regenerator1Address, inspector1Address, inspector2Address] =
      await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    communityRules = await communityRulesDeployed();

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      regenerationCredit.target,
      activistPoolArgs.halving,
      activistPoolArgs.blocksPerEra
    );

    instanceContractFactory = await ethers.getContractFactory("ActivistRules");
    instance = await instanceContractFactory.deploy(communityRules.target, activistPool.target);

    await communityRules.setContractCall(owner);
    await instance.setContractCall(owner, owner);

    await communityRules.newAllowedCaller(activ1Address);
    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
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
        context("when max limit is not reached", () => {
          it("should create activist", async () => {
            await addActivist("Activist A", activ1Address);
            await addActivist("Activist C", activ3Address);
            const activist = await instance.getActivist(activ1Address);

            expect(activist.activistWallet).to.equal(activ1Address.address);
          });

          it("should increment activistCount", async () => {
            await addActivist("Activist A", activ1Address);
            await addActivist("Activist C", activ3Address);
            const activistsCount = await communityRules.userTypesCount(userTypes.Activist);

            expect(activistsCount).to.equal(2);
          });

          it("should add created activist in userType contract as a ACTIVIST", async () => {
            await addActivist("Activist A", activ1Address);

            const userType = await communityRules.getUser(activ1Address);
            const ACTIVIST = 6;

            expect(userType).to.equal(ACTIVIST);
          });
        });

        context("when max limit is reached", () => {
          beforeEach(async () => {
            const communityRulesMock = await hre.artifacts.readArtifact("CommunityRules");
            let { _, abi: communityRulesAbi } = communityRulesMock;

            communityRules = await deployMockContract(owner, communityRulesAbi);

            instance = await instanceContractFactory.deploy(communityRules.target, activistPool.target);

            await communityRules.mock.userTypesCount.returns(16001);
          });

          it("should return error message", async () => {
            await expect(addActivist("Activist A", activ1Address)).to.be.revertedWith("Max user limit");
          });
        });
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

          await communityRules.setContractCall(activ1Address);
          await addInvitation(activ1Address, regenerator1Address, userTypes.Regenerator, activ1Address);
          await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

          await instance.addRegeneratorLevel(regenerator1Address, 3);
          await instance.addInspectorLevel(inspector1Address, 3);
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

          it("must increment approvedInvites", async () => {
            const approvedInvites = await instance.approvedInvites();

            expect(approvedInvites).to.equal(2);
          });
        });

        context("when current era of pool is 2", () => {
          beforeEach(async () => {
            await advanceBlock(activistPoolArgs.blocksPerEra);

            await addInvitation(activ1Address, inspector2Address, userTypes.Inspector, activ1Address);

            await instance.addRegeneratorLevel(regenerator1Address, 3);
            await instance.addInspectorLevel(inspector2Address, 3);
          });

          it("add level to activist.pool.level ", async () => {
            const activist = await instance.getActivist(activ1Address);

            expect(activist.pool.level).to.equal(3);
          });

          it("add level to era 2 activisPool", async () => {
            const eraLevels = await activistPool.eraLevels(2, activ1Address);

            expect(eraLevels).to.equal(1);
          });

          it("must increment approvedInvites", async () => {
            const approvedInvites = await instance.approvedInvites();

            expect(approvedInvites).to.equal(3);
          });
        });
      });

      context("when activist is not registered", () => {
        beforeEach(async () => {
          await communityRules.setContractCall(activ1Address);
          await addInvitation(activ1Address, regenerator1Address, userTypes.Regenerator, activ1Address);
          await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

          await instance.addRegeneratorLevel(regenerator1Address, 3);
          await instance.addInspectorLevel(inspector1Address, 3);
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
        await expect(instance.connect(activ1Address).addRegeneratorLevel(regenerator1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a activist", () => {
      beforeEach(async () => {
        await communityRules.setContractCall(activ1Address);

        await addActivist("Activist A", activ1Address);
      });

      context("when is era 1", () => {
        context("when activist have levels", () => {
          beforeEach(async () => {
            await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

            await instance.addRegeneratorLevel(regenerator1Address, 0);
            await instance.addInspectorLevel(inspector1Address, 3);
          });

          it("should return error message", async () => {
            await expect(instance.connect(activ1Address).withdraw()).to.be.revertedWith(
              "Not eligible to withdraw for this era"
            );
          });
        });
      });

      context("when is era 2", () => {
        context("when activist have levels", () => {
          beforeEach(async () => {
            await addInvitation(activ1Address, inspector1Address, userTypes.Inspector, activ1Address);

            await instance.addRegeneratorLevel(regenerator1Address, 0);
            await instance.addInspectorLevel(inspector1Address, 3);
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

              expect(balance).to.equal(1666666666666666666666666n);
            });
          });

          context("when have two activist", () => {
            beforeEach(async () => {
              await addActivist("Activist B", activ3Address);

              await communityRules.newAllowedCaller(activ3Address);
              await communityRules.setContractCall(activ3Address);
              await addInvitation(activ3Address, inspector2Address, userTypes.Inspector, activ3Address);

              await instance.addRegeneratorLevel(regenerator1Address, 0);
              await instance.addInspectorLevel(inspector2Address, 3);

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

              expect(balance).to.equal(833333333333333333333333n);
            });

            it("activist3 to era 2", async () => {
              const activist = await instance.getActivist(activ3Address);

              expect(activist.pool.currentEra).to.equal(2);
            });

            it("activist3 balance must be", async () => {
              const balance = await regenerationCredit.balanceOf(activ3Address);

              expect(balance).to.equal(833333333333333333333333n);
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

      await addInvitation(activ1Address, regenerator1Address, userTypes.Regenerator, owner);
      await addInvitation(activ1Address, inspector2Address, userTypes.Inspector, owner);

      await instance.addRegeneratorLevel(regenerator1Address, 3);
      await instance.addInspectorLevel(inspector2Address, 3);

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
