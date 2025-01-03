const { userContractDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("RegeneratorContract", () => {
  let instance;
  let regenerationCredit;
  let userContract;
  let regeneratorPool;
  let owner, prod1Address, prod2Address;

  const addRegenerator = async (name, from) => {
    await instance.connect(from).addRegenerator(10, name, "photoURL", "135465-005");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 50,
  };

  beforeEach(async () => {
    [owner, prod1Address, prod2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    userContract = await userContractDeployed();

    const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");

    regeneratorPool = await regeneratorPoolFactory.deploy(
      regenerationCredit.target,
      regeneratorPoolArgs.halving,
      regeneratorPoolArgs.blocksPerEra
    );

    const instanceFactory = await ethers.getContractFactory("RegeneratorContract");

    instance = await instanceFactory.deploy(userContract.target, regeneratorPool.target);

    await regenerationCredit.addContractPool(regeneratorPool.target, regeneratorPoolArgs.totalTokens);
    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await regeneratorPool.newAllowedCaller(instance.target);

    await addInvitation(owner, prod1Address, userTypes.Regenerator, owner);
    await addInvitation(owner, prod2Address, userTypes.Regenerator, owner);
  });

  context("when access regenerator fields", () => {
    it("should have fields", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.id).to.equal("1");
      expect(regenerator.regeneratorWallet).to.equal(prod1Address.address);
      expect(regenerator.name).to.equal("Regenerator A");
      expect(regenerator.proofPhoto).to.equal("photoURL");
      expect(regenerator.totalInspections).to.equal(0);
      expect(regenerator.pendingInspection).to.equal(false);
      expect(regenerator.regenerationScore.average).to.equal("0");
      expect(regenerator.regenerationScore.score).to.equal("0");

      expect(regenerator.pool.currentEra).to.equal(1);

      expect(regenerator.areaInformation.coordinates).to.equal("135465-005");
      expect(regenerator.areaInformation.totalArea).to.equal("10");
    });
  });

  context("when will create a regenerator (.addRegenerator)", () => {
    it("should create regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator B", prod2Address);
      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regeneratorWallet).to.equal(prod1Address.address);
    });

    it("should be created with totalRequest equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.totalInspections).to.equal(0);
    });

    it("should be created with avarage equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regenerationScore.average).to.equal("0");
    });

    it("should be created with regenerationScore equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regenerationScore.score).to.equal(0);
    });

    it("should be created with lastRequestAt equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.lastRequestAt).to.equal(0);
    });

    it("should increment regeneratorsCount after create regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator B", prod2Address);
      const regeneratorsCount = await userContract.userTypesCount(userTypes.Regenerator);

      expect(regeneratorsCount).to.equal(2);
    });

    it("should add created regenerator in userType contract as a REGENERATOR", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const userType = await userContract.getUser(prod1Address);
      const REGENERATOR = 1;

      expect(userType).to.equal(REGENERATOR);
    });
  });

  context("when regenerator alredy exists", () => {
    it("should return error when try create same regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      await expect(addRegenerator("Regenerator A", prod1Address)).to.be.revertedWith("User already exists");
    });
  });

  context("when regenerator don't exist", () => {
    it("should return false when regenerator don't exist", async () => {
      const regeneratorExists = await instance.regeneratorExists(prod1Address);

      expect(regeneratorExists).to.equal(false);
    });
  });

  context("when regenerator exists", () => {
    it("should return true when regenerator exists", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regeneratorExists = await instance.regeneratorExists(prod1Address);

      expect(regeneratorExists).to.equal(true);
    });
  });

  context("when call getRegenerator", () => {
    it("should return a regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regeneratorWallet).to.equal(prod1Address.address);
    });

    it("should return regenerators when call getRegenerators and has it", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator A", prod2Address);

      const regenerators = await instance.getRegenerators();

      expect(regenerators.length).to.equal(2);
    });

    it("should return regenerators zero when call getRegenerators and dont has it", async () => {
      const regenerators = await instance.getRegenerators();

      expect(regenerators.length).to.equal(0);
    });

    it("should return same regenerator in mapping and array list", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator A", prod2Address);

      const regenerators = await instance.getRegenerators();
      const regenerator1 = await instance.getRegenerator(prod1Address);
      const regenerator2 = await instance.getRegenerator(prod2Address);

      expect(regenerators[0].regenerator_wallet).to.equal(regenerator1.regenerator_wallet);
      expect(regenerators[1].regenerator_wallet).to.equal(regenerator2.regenerator_wallet);
    });
  });

  describe("#afterRequestInspection", () => {
    beforeEach(async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await instance.afterRequestInspection(prod1Address);
    });

    context("with allowed caller", () => {
      it("set pendingInspection to true", async () => {
        const regenerator = await instance.getRegenerator(prod1Address);

        expect(regenerator.pendingInspection).to.equal(true);
      });

      it("set lastRequestAt", async () => {
        const regenerator = await instance.getRegenerator(prod1Address);

        expect(regenerator.lastRequestAt).to.above(0);
      });
    });

    context("with not allowed caller", () => {
      it("return message error", async () => {
        await expect(instance.connect(prod1Address).afterRequestInspection(prod1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#afterRealizeInspection", () => {
    beforeEach(async () => {
      await addRegenerator("Regenerator A", prod1Address);
    });

    context("with allowed user", () => {
      describe(".setRegenerationScore", () => {
        context("when dont have regenerators sustainable", () => {
          context("when have 1 regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 600);
            });

            context("when new score + regenerator score is smaller than limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 70);
              });

              it("regenerator regeneration score must be 670", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(670);
              });

              it("regenerator must not be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(false);
              });
            });

            context("when new score is negative", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, -70);
              });

              it("regenerator regeneration score must be 530", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(530);
              });

              it("regenerator must not be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(false);
              });
            });

            context("when new score + regenerator score result in a negative value", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, -610);
              });

              it("regenerator regeneration score must be -10", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(-10);
              });

              it("regenerator must not be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(false);
              });
            });

            context("when new score + regenerator score is equal or bigger limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 400);
              });

              it("regenerator regeneration score must be 1000", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(1000);
              });

              it("regenerator must be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(true);
              });

              it("regenerators sustainable must increment", async () => {
                const regeneratorsSustainable = await instance.regeneratorsSustainable();

                expect(regeneratorsSustainable).to.equal(1);
              });
            });
          });

          context("when have more tha one regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 600);
              await addRegenerator("Regenerator B", prod2Address);
              await instance.afterRealizeInspection(prod2Address, 800);
            });

            context("when new score + regenerator A score is smaller than limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 70);
              });

              it("regenerator regeneration score must be 670", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(670);
              });

              it("regenerator must not be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(false);
              });
            });

            context("when new score + regenerator A score is equal than limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 400);
              });

              it("regenerator A regeneration score must be 1000", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(1000);
              });

              it("regenerator A must be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(true);
              });

              it("regenerators sustainable must increment", async () => {
                const regeneratorsSustainable = await instance.regeneratorsSustainable();

                expect(regeneratorsSustainable).to.equal(1);
              });
            });

            context("when new score + regenerator score result in a negative value", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, -610);
              });

              it("regenerator regeneration score must be -10", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(-10);
              });

              it("regenerator must not be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(false);
              });
            });
          });
        });

        context("when have regenerators sustainable", () => {
          context("when have 1 regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 1000);
            });

            context("when regenerator receive more 100 regeneration score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 100);
              });

              it("regenerator regeneration score must be 1100", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(1100);
              });

              it("regenerator must be sustainable", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.sustainable).to.equal(true);
              });
            });
          });

          context("when have more than one regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 1000);
              await addRegenerator("Regenerator B", prod2Address);
              await instance.afterRealizeInspection(prod2Address, 800);
            });

            context("when regenerator A receive more 100 regeneration score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 100);
              });

              it("regenerator A regeneration score must be 1100", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(1100);
              });
            });

            context("when regenerator B receive more 100 regeneration score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod2Address, 100);
              });

              it("regenerator B regeneration score must be 900", async () => {
                const regenerator = await instance.getRegenerator(prod2Address);

                expect(regenerator.regenerationScore.score).to.equal(900);
              });
            });
          });
        });

        context("when regenerator have reached minimum inspections", () => {
          beforeEach(async () => {
            await instance.afterRealizeInspection(prod1Address, 25);
            await instance.afterRealizeInspection(prod1Address, 25);
          });

          context("when is era 1", () => {
            context("when already have 50 levels in regenerator contract", () => {
              context("when receives more 25 levels", () => {
                beforeEach(async () => {
                  await instance.afterRealizeInspection(prod1Address, 25);
                });

                context("when is not in the pool yet", () => {
                  it("set 75 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(75);
                  });

                  it("regenerator regenerationScore must be 75", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(75);
                  });
                });

                context("when already in the pool", () => {
                  beforeEach(async () => {
                    await instance.afterRealizeInspection(prod1Address, 25);
                  });

                  it("set 100 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(100);
                  });

                  it("regenerator regenerationScore must be 100", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(100);
                  });
                });
              });

              context("when receives more -25 levels", () => {
                context("when is not in the pool yet", () => {
                  beforeEach(async () => {
                    await instance.afterRealizeInspection(prod1Address, -25);
                  });

                  it("set 0 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(0);
                  });

                  it("regenerator regenerationScore must be 25", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(25);
                  });
                });

                context("when already in the pool", () => {
                  beforeEach(async () => {
                    await instance.afterRealizeInspection(prod1Address, 25);
                    await instance.afterRealizeInspection(prod1Address, -25);
                  });

                  it("set 50 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(50);
                  });

                  it("regenerator regenerationScore must be 50", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(50);
                  });
                });

                context("when have negative values in regenerator contract", () => {
                  beforeEach(async () => {
                    await instance.afterRealizeInspection(prod1Address, -75);
                    await instance.afterRealizeInspection(prod1Address, 30);
                  });

                  it("set 5 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(5);
                  });

                  it("regenerator regenerationScore must be 5", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(5);
                  });
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when already have 50 levels in regenerator contract", () => {
              context("when receives more 50 levels", () => {
                beforeEach(async () => {
                  await advanceBlock(regeneratorPoolArgs.blocksPerEra);
                  await instance.afterRealizeInspection(prod1Address, 50);
                });

                it("set 50 levels to era 2 pool", async () => {
                  const eraLevels = await regeneratorPool.eraLevels(2, prod1Address);

                  expect(eraLevels).to.equal(100);
                });

                it("regenerator regenerationScore must be 100", async () => {
                  const regenerator = await instance.getRegenerator(prod1Address);

                  expect(regenerator.regenerationScore.score).to.equal(100);
                });
              });
            });
          });
        });
      });

      describe(".incrementInspections", () => {
        beforeEach(async () => {
          await instance.afterRealizeInspection(prod1Address, 0);
        });

        it("incrementInspections", async () => {
          const regenerator = await instance.getRegenerator(prod1Address);

          expect(regenerator.totalInspections).to.equal(1);
        });
      });
    });

    context("with not allowed user", () => {
      it("should return error message", async () => {
        await expect(instance.connect(prod1Address).afterRealizeInspection(prod1Address, 50)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#withdraw", () => {
    context("with regenerator", () => {
      beforeEach(async () => {
        await addRegenerator("Regenerator A", prod1Address);
        await addRegenerator("Regenerator B", prod2Address);
      });

      context("when can approve #blockable", () => {
        context("when regenerator have minimum inspections", () => {
          context("when levels in era is 100", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 0);
              await instance.afterRealizeInspection(prod1Address, 0);
              await instance.afterRealizeInspection(prod1Address, 0);
            });

            context("when regenerator have regenerationScore 50", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod2Address, 0);
                await instance.afterRealizeInspection(prod2Address, 0);
                await instance.afterRealizeInspection(prod2Address, 0);

                await instance.afterRealizeInspection(prod1Address, 50);
                await instance.afterRealizeInspection(prod2Address, 50);

                await advanceBlock(regeneratorPoolArgs.blocksPerEra);

                await instance.connect(prod1Address).withdraw();
                await instance.connect(prod2Address).withdraw();
              });

              it("regenerator A must withdraw 3750000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(3750000000000000000000000n);
              });

              it("regenerator B must withdraw 3750000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod2Address);

                expect(balanceOf).to.equal(3750000000000000000000000n);
              });

              it("regenerator A current era must be incremented", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });

              it("regenerator B current era must be incremented", async () => {
                const regenerator = await instance.getRegenerator(prod2Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });
            });

            context("when regenerator have regenerationScore 100", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 100);
                await advanceBlock(regeneratorPoolArgs.blocksPerEra);
                await instance.connect(prod1Address).withdraw();
              });

              it("must withdraw 7500000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(7500000000000000000000000n);
              });

              it("regenerator current era must be increment", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });
            });
          });
        });

        context("when regenerator dont have minimum inspections", () => {
          it("should return error message", async () => {
            await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("Minimum inspections");
          });
        });
      });

      context("when cant approve #blockable", () => {
        beforeEach(async () => {
          await instance.afterRealizeInspection(prod1Address, 0);
          await instance.afterRealizeInspection(prod1Address, 0);
          await instance.afterRealizeInspection(prod1Address, 0);
        });

        it("should return error message", async () => {
          await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with not regenerator", () => {
      it("should return error message", async () => {
        await expect(instance.withdraw()).to.be.revertedWith("Only regenerators pool");
      });
    });
  });

  describe("#regeneratorPoolEra", () => {
    context("when pool is in era 1", () => {
      it("return era equal 1", async () => {
        const currentEra = await instance.regeneratorPoolEra();

        expect(currentEra).to.equal(1);
      });
    });

    context("when pool is in era 2", () => {
      beforeEach(async () => {
        await advanceBlock(regeneratorPoolArgs.blocksPerEra);
      });

      it("return era equal 1", async () => {
        const currentEra = await instance.regeneratorPoolEra();

        expect(currentEra).to.equal(2);
      });
    });
  });
});
