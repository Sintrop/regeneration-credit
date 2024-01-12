const DeveloperContract = artifacts.require("DeveloperContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");

contract("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let rcToken;
  let [owner, dev1Address, dev2Address, dev3Address] = accounts;

  let developerPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  const addDeveloper = async (name, from) => {
    await instance.addDeveloper(name, "photoURL", { from: from });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  beforeEach(async () => {
    rcToken = await rcTokenDeployed();

    developerPool = await DeveloperPool.new(
      rcToken.address,
      developerPoolParams.halving,
      developerPoolParams.totalEras,
      developerPoolParams.blocksPerEra
    );

    userContract = await userContractDeployed();

    instance = await DeveloperContract.new(userContract.address, developerPool.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(owner);
    await developerPool.newAllowedCaller(instance.address);
    await rcToken.addContractPool(developerPool.address, "30000000000000000000000000");

    await addInvitation(owner, dev1Address, userTypes.Developer, owner);
  });

  describe(".fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.id, "1");
      assert.equal(developer.developerWallet, dev1Address);
      assert.equal(developer.userType, 4);
      assert.equal(developer.name, "Developer A");
      assert.equal(developer.proofPhoto, "photoURL");

      assert.equal(developer.pool.level, 0);
      assert.equal(developer.pool.currentEra, 1);
    });
  });

  describe("#addDeveloper", () => {
    context("when is not invited", () => {
      it("should return error message", async () => {
        await expectRevert(addDeveloper("Developer C", dev3Address), "Invalid invitation");
      });
    });

    context("when is invited", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expectRevert(addDeveloper("Developer A", dev1Address), "This developer already exist");
        });
      });

      context("when developer does not exist", () => {
        it("should add developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.developerWallet, dev1Address);
        });

        it("should increment developersCount after create developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developersCount = await instance.developersCount();

          assert.equal(developersCount, 1);
        });

        it("should add created developer in developerList (array)", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developers = await instance.getDevelopers();

          assert.equal(developers[0].developerWallet, dev1Address);
        });

        it("should add created developer in userType contract as a DEVELOPER", async () => {
          await addDeveloper("Developer A", dev1Address);

          const userType = await userContract.getUser(dev1Address);
          const DEVELOPER = 4;

          assert.equal(userType, DEVELOPER);
        });

        it("should add created developer with initial level equal 0", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.pool.level, 0);
        });

        it("should add created developer with initial currentEra equal currentContractEra", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.pool.currentEra, 1);
        });
      });
    });
  });

  describe("addContribution", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    context("with developer", () => {
      context("when already has contribution", () => {
        beforeEach(async () => {
          await instance.addContribution("report", { from: dev1Address });
        });

        it("should return error message", async () => {
          await expectRevert(instance.addContribution("report", { from: dev1Address }), "Already has contribution");
        });
      });

      context("when don't have contribution", () => {
        beforeEach(async () => {
          await instance.addContribution("report", { from: dev1Address });
        });

        it("add contribution", async () => {
          const construbution = await instance.contributions(1, dev1Address);

          assert.equal(construbution.report, "report");
        });

        it("add level to developer", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.pool.level, 1);
        });

        it("add level to era", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          assert.equal(eraLevels, 1);
        });
      });
    });

    context("without developer", () => {
      it("should return error message", async () => {
        await expectRevert(instance.addContribution("report", { from: owner }), "Only Developer");
      });
    });
  });

  describe("#getDevelopers", () => {
    beforeEach(async () => {
      await addInvitation(owner, dev2Address, userTypes.Developer, owner);
    });
    it("should return developers when has developers", async () => {
      await addDeveloper("Developer A", dev1Address);
      await addDeveloper("Developer B", dev2Address);

      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 2);
    });

    it("should return developers equal zero when dont has it", async () => {
      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 0);
    });
  });

  describe("#getDeveloper", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.developerWallet, dev1Address);
    });
  });

  describe("#developerExists", () => {
    it("should return true when exists", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, true);
    });

    it("it should return false when don't exists", async () => {
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, false);
    });
  });

  describe("#withdraw", () => {
    context("when is developer", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      context("when can withdraw tokens", () => {
        context("when is unique developer in era with 1 level", () => {
          context("when Developer is in era 1 and contract is in era 2", () => {
            beforeEach(async () => {
              await instance.addContribution("report", { from: dev1Address });

              await advanceBlock(developerPoolParams.blocksPerEra + 2);
              await instance.withdraw({ from: dev1Address });
            });

            it("should add developer to era 2", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              assert.equal(developer.pool.currentEra, 2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await developerPool.balanceOf(dev1Address);

              let tokensBalance = 1200000000000000000000000n;

              assert.equal(balanceOf, tokensBalance);
            });
          });
        });

        context("when has two devs in the era", () => {
          beforeEach(async () => {
            await addInvitation(owner, dev2Address, userTypes.Developer, owner);
            await addDeveloper("Developer B", dev2Address);
          });

          context("with same levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.addContribution("report", { from: dev1Address });
                await instance.addContribution("report", { from: dev2Address });

                await advanceBlock(developerPoolParams.blocksPerEra + 2);
                await instance.withdraw({ from: dev1Address });
                await instance.withdraw({ from: dev2Address });
              });

              it("should add developer1 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                assert.equal(developer.pool.currentEra, 2);
              });

              it("should add developer2 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                assert.equal(developer.pool.currentEra, 2);
              });

              it("developer1 balance must be 600000000000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev1Address);

                let tokensPerEra = 600000000000000000000000n;

                assert.equal(balanceOf, tokensPerEra);
              });

              it("developer2 balance must be 600000000000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev2Address);

                let tokensPerEra = 600000000000000000000000n;

                assert.equal(balanceOf, tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addContribution("report", { from: dev1Address });
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.withdraw({ from: dev1Address });
          });

          it("should return error message", async () => {
            await expectRevert(instance.withdraw({ from: dev1Address }), "Can't approve withdraw");
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addContribution("report", { from: dev1Address });
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.addContribution("report", { from: dev1Address });
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.withdraw({ from: dev1Address });
            await instance.withdraw({ from: dev1Address });
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await developerPool.balanceOf(dev1Address);
            let tokensPerEra = 2400000000000000000000000;

            assert.equal(balanceOf, tokensPerEra);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expectRevert(instance.withdraw({ from: dev1Address }), "Can't approve withdraw");
        });
      });
    });

    context("when is not developer", () => {
      it("should return error message", async () => {
        await expectRevert(instance.withdraw({ from: dev1Address }), "Pool only to developer");
      });
    });
  });
});