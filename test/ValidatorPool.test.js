const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ValidatorPool", () => {
  let instance;
  let owner, validator1Address, validator2Address;

  const args = {
    totalValidatorPoolTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [owner, validator1Address, validator2Address] = await ethers.getSigners();

    const rcToken = await rcTokenDeployed();

    const instanceFactory = await ethers.getContractFactory("ValidatorPool");
    instance = await instanceFactory.deploy(rcToken.target, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.target, args.totalValidatorPoolTokens);
  });

  describe("after deploy", () => {
    it("must blocksPerEra be equal the deployed value", async () => {
      const blocksPerEra = await instance.blocksPerEra();

      expect(blocksPerEra).to.equal(args.blocksPerEra);
    });

    it("must initial era equal one", async () => {
      const currentContractEra = await instance.currentContractEra();
      expect(currentContractEra).to.equal(1);
    });
  });

  describe("#getEra", () => {
    context("when access fields", () => {
      it("should have fields", async () => {
        const era = await instance.getEra(1);

        expect(era.levels).to.equal(0);
        expect(era.tokens).to.equal(0);
        expect(era.users).to.equal(0);
      });
    });
  });

  describe("#nextApproveIn", () => {
    context("when cant approve", () => {
      it("should return integer > zero", async () => {
        let currentEra = 1;
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        expect(parseInt(nextApproveIn)).to.above(0);
      });
    });

    context("when can approve", () => {
      it("should return integer < zero", async () => {
        let currentEra = 1;

        await advanceBlock(args.blocksPerEra);
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        expect(parseInt(nextApproveIn)).to.lessThan(1);
      });
    });
  });

  describe("#balance", () => {
    it("must return balance of ValidatorPool", async () => {
      const balance = await instance.balance();

      expect(balance).to.equal(args.totalValidatorPoolTokens);
    });
  });

  describe("#balanceOf", () => {
    it("should return balanceOf address", async () => {
      const balanceOf = await instance.balanceOf(instance.target);

      expect(balanceOf).to.equal(args.totalValidatorPoolTokens);
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

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to validator1", async () => {
              const eraLevels = await instance.eraLevels(1, validator1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to validator2", async () => {
              const eraLevels = await instance.eraLevels(1, validator2Address);

              expect(eraLevels).to.equal(1);
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

              expect(era1.levels).to.equal(11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 7 level to validator1", async () => {
              const eraLevels = await instance.eraLevels(1, validator1Address);

              expect(eraLevels).to.equal(7);
            });

            it("eraLevels must have 4 level to validator2", async () => {
              const eraLevels = await instance.eraLevels(1, validator2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(validator1Address).addLevel(validator1Address, 1, 1)).to.be.revertedWith(
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

              expect(era1.levels).to.equal(1);
            });

            it("validator1 levels in era 1 must be 1", async () => {
              const level = await instance.eraLevels(1, validator1Address);

              expect(level).to.equal(1);
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

                expect(era.levels).to.equal(2);
              });

              it("validator1 levels in era 1 must be 2", async () => {
                const level = await instance.eraLevels(1, validator1Address);

                expect(level).to.equal(2);
              });

              it("era 2 must have 1 level", async () => {
                const era = await instance.getEra(2);

                expect(era.levels).to.equal(1);
              });

              it("validator1 levels in era 2 must be 1", async () => {
                const level = await instance.eraLevels(2, validator1Address);

                expect(level).to.equal(1);
              });
            });
          });
        });
      });

      context("when validator1 dont have levels in era", () => {
        it("should return error message", async () => {
          instance.removeLevel(validator1Address);

          const level = await instance.eraLevels(2, validator1Address);

          expect(level).to.equal(0);
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(validator1Address).removeLevel(validator1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#canApproveTimes", () => {
    context("when cant approve", () => {
      it("should return zero times", async () => {
        let currentEra = 1;
        const canApproveTimes = await instance.canApproveTimes(currentEra);

        expect(canApproveTimes).to.equal(0);
      });
    });

    context("when can approve 2 times", () => {
      it(`should return two times`, async () => {
        let currentEra = 1;
        await advanceBlock(args.blocksPerEra * 2 + 2);

        const canApproveTimes = await instance.canApproveTimes(currentEra);

        const blocksPrecision = await instance.BLOCKS_PRECISION();
        const fixedPoint = parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision);

        expect(Math.ceil(fixedPoint)).to.equal(2);
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

                expect(balanceOf).to.equal(600000000000000000000000n);
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

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("shoud withdraw 0 tokens to validator2", async () => {
                await instance.withdraw(validator2Address, 1);
                const balanceOf = await instance.balanceOf(validator2Address);

                expect(balanceOf).to.equal("0");
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

                expect(balanceOf).to.equal(600000000000000000000000n);
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

                expect(balance).to.equal(27600000000000000000000000n);
              });

              it("validator1 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await instance.balanceOf(validator1Address);

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("validator1 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, validator1Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });

              it("validator1 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, validator1Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
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

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("validator2 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, validator2Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });

              it("validator2 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, validator2Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expect(instance.withdraw(validator1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(validator1Address).withdraw(validator1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
