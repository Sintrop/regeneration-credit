const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { ethers } = require("hardhat");

describe("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let rcToken;
  let owner, dev1Address, dev2Address, dev3Address;

  let developerPoolParams = {
    blocksPerEra: 20,
    eraMax: 5,
  };

  const addDeveloper = async (name, from) => {
    await instance.connect(from).addDeveloper(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, dev1Address, dev2Address, dev3Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
    developerPool = await developerPoolFactory.deploy(
      rcToken.target,
      developerPoolParams.blocksPerEra,
      developerPoolParams.eraMax
    );

    developerContractFactory = await ethers.getContractFactory("DeveloperContract");
    instance = await developerContractFactory.deploy(userContract.target, developerPool.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await developerPool.newAllowedCaller(instance.target);
    await rcToken.addContractPool(developerPool.target, "15000000000000000000000000");

    await addInvitation(owner, dev1Address, userTypes.Developer, owner);
  });

  describe(".fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.id).to.equal("1");
      expect(developer.developerWallet).to.equal(dev1Address.address);
      expect(developer.userType).to.equal(4);
      expect(developer.name).to.equal("Developer A");
      expect(developer.proofPhoto).to.equal("photoURL");

      expect(developer.pool.level).to.equal(0);
      expect(developer.pool.currentEra).to.equal(1);
    });
  });

  describe("#addDeveloper", () => {
    context("when is not invited", () => {
      it("should return error message", async () => {
        await expect(addDeveloper("Developer C", dev3Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is invited", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expect(addDeveloper("Developer A", dev1Address)).to.be.revertedWith("This developer already exist");
        });
      });

      context("when developer does not exist", () => {
        it("should add developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.developerWallet).to.equal(dev1Address.address);
        });

        it("should increment developersCount after create developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developersCount = await instance.developersCount();

          expect(developersCount).to.equal(1);
        });

        it("should add created developer in developerList (array)", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developers = await instance.getDevelopers();

          expect(developers[0].developerWallet).to.equal(dev1Address.address);
        });

        it("should add created developer in userType contract as a DEVELOPER", async () => {
          await addDeveloper("Developer A", dev1Address);

          const userType = await userContract.getUser(dev1Address);
          const DEVELOPER = 4;

          expect(userType).to.equal(DEVELOPER);
        });

        it("should add created developer with initial level equal 0", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.level).to.equal(0);
        });

        it("should add created developer with initial currentEra equal currentContractEra", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.currentEra).to.equal(1);
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
          await instance.connect(dev1Address).addContribution("report");
        });

        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).addContribution("report")).to.be.revertedWith(
            "Already has contribution"
          );
        });
      });

      context("when don't have contribution", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addContribution("report");
        });

        it("add contribution", async () => {
          const construbution = await instance.contributions(1, dev1Address);

          expect(construbution.report).to.equal("report");
        });

        it("add level to developer", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.level).to.equal(1);
        });

        it("add level to era", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          expect(eraLevels).to.equal(1);
        });
      });
    });

    context("without developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContribution("report")).to.be.revertedWith("Only Developer");
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

      expect(developers.length).to.equal(2);
    });

    it("should return developers equal zero when dont has it", async () => {
      const developers = await instance.getDevelopers();

      expect(developers.length).to.equal(0);
    });
  });

  describe("#getDeveloper", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.developerWallet).to.equal(dev1Address.address);
    });
  });

  describe("#developerExists", () => {
    it("should return true when exists", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developerExists = await instance.developerExists(dev1Address);

      expect(developerExists).to.equal(true);
    });

    it("it should return false when don't exists", async () => {
      const developerExists = await instance.developerExists(dev1Address);

      expect(developerExists).to.equal(false);
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
              await instance.connect(dev1Address).withdraw();
            });

            it("should add developer to era 2", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              expect(developer.pool.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await developerPool.balanceOf(dev1Address);

              let tokensBalance = 833333000000000000000000n;

              expect(balanceOf).to.equal(tokensBalance);
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
                await instance.addLevel(dev1Address);
                await instance.addLevel(dev2Address);

                await advanceBlock(developerPoolParams.blocksPerEra + 2);
                await instance.connect(dev1Address).withdraw();
                await instance.connect(dev2Address).withdraw();
              });

              it("should add developer1 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("should add developer2 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("developer1 balance must be 416666500000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev1Address);

                let tokensPerEra = 416666500000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("developer2 balance must be 416666500000000000000000", async () => {
                let balanceOf = await developerPool.balanceOf(dev2Address);

                let tokensPerEra = 416666500000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
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
                await instance.connect(dev1Address).withdraw();
                await instance.connect(dev2Address).withdraw();
              });

              it("should add developer1 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("should add developer2 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("developer1 balance must be 555555333333333333333332", async () => {
                let balanceOf = await developerPool.balanceOf(dev1Address);

                let tokensPerEra = 555555333333333333333333n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("developer2 balance must be 277777666666666666666666", async () => {
                let balanceOf = await developerPool.balanceOf(dev2Address);

                let tokensPerEra = 277777666666666666666666n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.connect(dev1Address).withdraw();
          });

          it("should return error message", async () => {
            await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.addLevel(dev1Address);
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).withdraw();
            await instance.connect(dev1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await developerPool.balanceOf(dev1Address);
            let tokensPerEra = 1666666000000000000000000n;

            expect(balanceOf).to.equal(tokensPerEra);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });
    });

    context("when is not developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Pool only to developer");
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
              await instance.addLevel(dev1Address);
            });

            it("era1 should have 1 level", async () => {
              let era = await developerPool.getEra(1);

              expect(era.levels).to.equal(1);
            });

            it("developer1 should have 1 level", async () => {
              let developer = await instance.getDeveloper(dev1Address);

              expect(developer.pool.level).to.equal(1);
            });
          });
        });

        context("when developer1 have 2 levels", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address);
            await instance.addLevel(dev1Address);
          });

          context("when receive 1 level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address);
            });

            it("era1 should have 3 level", async () => {
              let era = await developerPool.getEra(1);

              expect(era.levels).to.equal(3);
            });

            it("developer1 should have 3 levels", async () => {
              let developer = await instance.getDeveloper(dev1Address);

              expect(developer.pool.level).to.equal(3);
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
        await expect(instance.connect(dev1Address).addLevel(dev1Address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
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

              expect(developer.pool.level).to.equal(1);
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
        await expect(instance.connect(dev1Address).removeLevel(dev1Address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
    });

    context("when try remove more levels than the developer levels", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expect(instance.removeLevel(dev1Address)).to.be.revertedWith("Not enough levels to remove");
      });
    });
  });
});
