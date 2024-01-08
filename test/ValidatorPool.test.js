const RcToken = artifacts.require("RcToken");
const ValidatorPool = artifacts.require("ValidatorPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");

contract("ValidatorPool", (accounts) => {
  let instance;
  let [owner, validator1Address, validator2Address] = accounts;

  const args = {
    totalValidatorPoolTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    const rcToken = await rcTokenDeployed();
    instance = await ValidatorPool.new(rcToken.address, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.address, args.totalValidatorPoolTokens);
  });

  describe("after deploy", () => {
    it("must blocksPerEra be equal the deployed value", async () => {
      const blocksPerEra = await instance.blocksPerEra();

      assert.equal(blocksPerEra, args.blocksPerEra);
    });

    it("must initial era equal one", async () => {
      const currentContractEra = await instance.currentContractEra();
      assert.equal(currentContractEra, 1);
    });
  });

  describe("#getEra", () => {
    context("when access fields", () => {
      it("should have fields", async () => {
        const era = await instance.getEra(1);

        assert.equal(era.levels, 0);
        assert.equal(era.tokens, 0);
        assert.equal(era.users, 0);
      });
    });
  });

  describe("#nextApproveIn", () => {
    context("when cant approve", () => {
      it("should return integer > zero", async () => {
        let currentEra = 1;
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        assert.isAbove(parseInt(nextApproveIn), 0);
      });
    });

    context("when can approve", () => {
      it("should return integer < zero", async () => {
        let currentEra = 1;

        await advanceBlock(args.blocksPerEra);
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        assert.isBelow(parseInt(nextApproveIn), 1);
      });
    });
  });

  describe("#balance", () => {
    it("must return balance of ValidatorPool", async () => {
      const balance = await instance.balance();

      assert.equal(balance, args.totalValidatorPoolTokens);
    });
  });

  describe("#balanceOf", () => {
    it("should return balanceOf address", async () => {
      const balanceOf = await instance.balanceOf(instance.address);

      assert.equal(balanceOf, args.totalValidatorPoolTokens);
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when validator have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 1 level to validator1", async () => {
              const eraLevels = await instance.eraLevels(1, validator1Address);

              assert.equal(eraLevels, 1);
            });

            it("eraLevels must have 1 level to validator2", async () => {
              const eraLevels = await instance.eraLevels(1, validator2Address);

              assert.equal(eraLevels, 1);
            });
          });
        });

        context("when validators have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(validator1Address, 1, 1);
            await instance.addLevel(validator1Address, 1, 5);

            await instance.addLevel(validator2Address, 1, 1);
            await instance.addLevel(validator2Address, 1, 1);
            await instance.addLevel(validator2Address, 1, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);
            });

            it("era 1 must have 11 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 7 level to validator1", async () => {
              const eraLevels = await instance.eraLevels(1, validator1Address);

              assert.equal(eraLevels, 7);
            });

            it("eraLevels must have 4 level to validator2", async () => {
              const eraLevels = await instance.eraLevels(1, validator2Address);

              assert.equal(eraLevels, 4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.addLevel(validator1Address, 1, 1, { from: validator1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  describe("#removeLevel", () => {
    context("with allowed caller", () => {
      context("when validator1 have 2 levels in era 1", () => {
        beforeEach(async () => {
          await instance.addLevel(validator1Address, 1, 1);
          await instance.addLevel(validator1Address, 1, 1);
        });

        context("when is era 1", () => {
          context("when remove level", () => {
            beforeEach(async () => {
              await instance.removeLevel(validator1Address);
            });

            it("era 1 must have 1 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 1);
            });

            it("validator1 levels in era 1 must be 1", async () => {
              const level = await instance.eraLevels(1, validator1Address);

              assert.equal(level, 1);
            });
          });
        });

        context("when is era 2", () => {
          context("when have 2 levels in era 2", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator1Address, 1, 1);
            });

            context("when remove level", () => {
              beforeEach(async () => {
                await instance.removeLevel(validator1Address);
              });

              it("era 1 must have 2 level", async () => {
                const era = await instance.getEra(1);

                assert.equal(era.levels, 2);
              });

              it("validator1 levels in era 1 must be 2", async () => {
                const level = await instance.eraLevels(1, validator1Address);

                assert.equal(level, 2);
              });

              it("era 2 must have 1 level", async () => {
                const era = await instance.getEra(2);

                assert.equal(era.levels, 1);
              });

              it("validator1 levels in era 2 must be 1", async () => {
                const level = await instance.eraLevels(2, validator1Address);

                assert.equal(level, 1);
              });
            });
          });
        });
      });

      context("when validator1 dont have levels in era", () => {
        it("should return error message", async () => {
          await expectRevert(instance.removeLevel(validator1Address), "Not enough levels to remove");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(instance.removeLevel(validator1Address, { from: validator1Address }), "Not allowed caller");
      });
    });
  });

  describe("#canApproveTimes", () => {
    context("when cant approve", () => {
      it("should return zero times", async () => {
        let currentEra = 1;
        const canApproveTimes = await instance.canApproveTimes(currentEra);

        assert.equal(canApproveTimes, 0);
      });
    });

    context("when can approve 2 times", () => {
      it(`should return two times`, async () => {
        let currentEra = 1;
        await advanceBlock(args.blocksPerEra * 2 + 2);

        const canApproveTimes = await instance.canApproveTimes(currentEra);

        const blocksPrecision = await instance.BLOCKS_PRECISION();
        const fixedPoint = canApproveTimes / 10 ** blocksPrecision;

        assert.equal(Math.ceil(fixedPoint), 2);
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when is era 1", () => {
          context("when total of levels in era is 6", () => {
            context("when validator1 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);

                await instance.addLevel(validator2Address, 1, 1);
                await instance.addLevel(validator2Address, 1, 1);
                await instance.addLevel(validator2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("must withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(validator1Address, 1);
                const balanceOf = await instance.balanceOf(validator1Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });
            });

            context("when validator1 have 6 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 1200000000000000000000000 tokens", async () => {
                await instance.withdraw(validator1Address, 1);
                const balanceOf = await instance.balanceOf(validator1Address);

                assert.equal(balanceOf, 1200000000000000000000000n);
              });

              it("shoud withdraw 0 tokens to validator2", async () => {
                await instance.withdraw(validator2Address, 1);
                const balanceOf = await instance.balanceOf(validator2Address);

                assert.equal(balanceOf, "0");
              });
            });

            context("when validator2 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);
                await instance.addLevel(validator1Address, 1, 1);

                await instance.addLevel(validator2Address, 1, 1);
                await instance.addLevel(validator2Address, 1, 1);
                await instance.addLevel(validator2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(validator2Address, 1);
                const balanceOf = await instance.balanceOf(validator2Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when dont have withdraw from era 1", () => {
            beforeEach(async () => {
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator1Address, 1, 1);

              await instance.addLevel(validator2Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);

              await advanceBlock(8);

              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator1Address, 1, 1);
              await instance.addLevel(validator1Address, 1, 1);

              await instance.addLevel(validator2Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);
              await instance.addLevel(validator2Address, 1, 1);
            });

            context("when validator1 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(validator1Address, 1);
                await instance.withdraw(validator1Address, 2);

                await instance.withdraw(validator2Address, 1);
                await instance.withdraw(validator2Address, 2);
              });

              it("validator pool balance must be 27600000000000000000000000", async () => {
                const balance = await instance.balance();

                assert.equal(balance, 27600000000000000000000000n);
              });

              it("validator1 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await instance.balanceOf(validator1Address);

                assert.equal(balanceOf, 1200000000000000000000000n);
              });

              it("validator1 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, validator1Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });

              it("validator1 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, validator1Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });
            });

            context("when validator2 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(validator1Address, 1);
                await instance.withdraw(validator1Address, 2);

                await instance.withdraw(validator2Address, 1);
                await instance.withdraw(validator2Address, 2);
              });

              it("validator2 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await instance.balanceOf(validator2Address);

                assert.equal(balanceOf, 1200000000000000000000000n);
              });

              it("validator2 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, validator2Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });

              it("validator2 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, validator2Address);

                assert.equal(balanceOf, 600000000000000000000000n);
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expectRevert(instance.withdraw(validator1Address, 1), "You can't approve yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(instance.withdraw(validator1Address, 1, { from: validator1Address }), "Not allowed caller");
      });
    });
  });
});