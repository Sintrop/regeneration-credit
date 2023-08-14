const DeveloperContract = artifacts.require("DeveloperContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let [owner, dev1Address, dev2Address, dev3Address] = accounts;

  let developerPoolParams = {
    blocksPerEra: 20,
    eraMax: 5,
  };

  const addDeveloper = async (name, from) => {
    await instance.addDeveloper(name, "photoURL", { from: from });
  };

  advanceBlock = async (blocksNumber) => {
    for (let i = 0; i < blocksNumber; i++) {
      let promise = new Promise((resolve, reject) => {
        web3.currentProvider.send(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime(),
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            const newBlockHash = web3.eth.getBlock("latest").hash;

            return resolve(newBlockHash);
          }
        );
      });
    }
  };

  beforeEach(async () => {
    const sacToken = await SacToken.new("1500000000000000000000000000");
    developerPool = await DeveloperPool.new(
      sacToken.address,
      developerPoolParams.blocksPerEra,
      developerPoolParams.eraMax
    );

    userContract = await UserContract.new();

    instance = await DeveloperContract.new(userContract.address, developerPool.address);

    await userContract.newAllowedCaller(instance.address);
    await developerPool.newAllowedCaller(instance.address);
    await instance.newAllowedUser(dev1Address);
    await instance.newAllowedUser(dev2Address);
    await instance.newAllowedUser(owner);
    await sacToken.addContractPool(developerPool.address, "15000000000000000000000000");
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
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addDeveloper("Developer C", dev3Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
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
  });

  describe("#getDevelopers", () => {
    beforeEach(async () => {
      await instance.newAllowedUser(dev2Address);
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
              await instance.addLevel(dev1Address);

              await advanceBlock(developerPoolParams.blocksPerEra + 2);
              await instance.withdraw({ from: dev1Address });
            });

            it("should add developer to era 2", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              assert.equal(developer.pool.currentEra, 2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await developerPool.balanceOf(dev1Address);

              let tokensBalance = 833333000000000000000000n;

              assert.equal(balanceOf, tokensBalance);
            });
          });
        });

        context("when has two devs in the era", () => {
          beforeEach(async () => {
            await addDeveloper("Developer B", dev2Address);
          });

          context("with same levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address);
                await instance.addLevel(dev2Address);

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

              it("developer1 balance must be 416666500000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev1Address);

                let tokensPerEra = 416666500000000000000000n;

                assert.equal(balanceOf, tokensPerEra);
              });

              it("developer2 balance must be 416666500000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev2Address);

                let tokensPerEra = 416666500000000000000000n;

                assert.equal(balanceOf, tokensPerEra);
              });
            });
          });

          context("with different levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address);
                await instance.addLevel(dev1Address);
                await instance.addLevel(dev2Address);

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

              it("developer1 balance must be 555555333333333333333332", async () => {
                let balanceOf = await developerPool.balanceOf(dev1Address);

                let tokensPerEra = 555555333333333333333333n;

                assert.equal(balanceOf, tokensPerEra);
              });

              it("developer2 balance must be 277777666666666666666666", async () => {
                let balanceOf = await developerPool.balanceOf(dev2Address);

                let tokensPerEra = 277777666666666666666666n;

                assert.equal(balanceOf, tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.withdraw({ from: dev1Address });
          });

          it("should return error message", async () => {
            await expectRevert(instance.withdraw({ from: dev1Address }), "Can't approve withdraw");
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.withdraw({ from: dev1Address });
            await instance.withdraw({ from: dev1Address });
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await developerPool.balanceOf(dev1Address);
            let tokensPerEra = 1666666000000000000000000;

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

  describe("#addLevel", () => {
    context("with owner", () => {
      context("when the developer is in era 1", () => {
        beforeEach(async () => {
          await addDeveloper("Developer A", dev1Address);
        });

        context("when developer1 have 0 levels", () => {
          context("when receive 1 level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, { from: owner });
            });

            it("era1 should have 1 level", async () => {
              let era = await developerPool.getEra(1);

              assert.equal(era.levels, 1);
            });

            it("developer1 should have 1 level", async () => {
              let developer = await instance.getDeveloper(dev1Address);

              assert.equal(developer.pool.level, 1);
            });
          });
        });

        context("when developer1 have 2 levels", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address, { from: owner });
            await instance.addLevel(dev1Address, { from: owner });
          });

          context("when receive 1 level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, { from: owner });
            });

            it("era1 should have 3 level", async () => {
              let era = await developerPool.getEra(1);

              assert.equal(era.levels, 3);
            });

            it("developer1 should have 3 levels", async () => {
              let developer = await instance.getDeveloper(dev1Address);

              assert.equal(developer.pool.level, 3);
            });
          });
        });
      });
    });

    context("with non owner", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(instance.addLevel(dev1Address, { from: dev1Address }), "Ownable: caller is not the owner");
      });
    });
  });

  describe("#removeLevel", () => {
    context("with owner", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      context("when the developer is in era 1", () => {
        context("when developer1 have 2 levels", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await instance.addLevel(dev1Address);
          });

          context("when remove 1 level", () => {
            beforeEach(async () => {
              await instance.removeLevel(dev1Address);
            });

            it("developer1 must have 1 level only", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              assert.equal(developer.pool.level, 1);
            });
          });
        });
      });
    });

    context("with non owner", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(dev1Address, { from: dev1Address }),
          "Ownable: caller is not the owner"
        );
      });
    });

    context("when try remove more levels than the developer levels", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(instance.removeLevel(dev1Address, { from: owner }), "Not enough levels to remove");
      });
    });
  });
});
