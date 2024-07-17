const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ActivistPool", () => {
  let instance, rcToken;
  let owner, activist1Address, activist2Address;

  const args = {
    totalActivistPoolTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [owner, activist1Address, activist2Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    instance = await activistPoolFactory.deploy(rcToken.target, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.target, args.totalActivistPoolTokens);
  });

  describe("after deploy", () => {
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
    it("must return balance of ActivistPool", async () => {
      const balance = await instance.balance();

      expect(balance).to.equal(args.totalActivistPoolTokens);
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when activist have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to activist1", async () => {
              const eraLevels = await instance.eraLevels(1, activist1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to activist2", async () => {
              const eraLevels = await instance.eraLevels(1, activist2Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when activists have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(activist1Address, 1, 1);
            await instance.addLevel(activist1Address, 1, 5);

            await instance.addLevel(activist2Address, 1, 1);
            await instance.addLevel(activist2Address, 1, 1);
            await instance.addLevel(activist2Address, 1, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);
            });

            it("era 1 must have 11 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 7 level to activist1", async () => {
              const eraLevels = await instance.eraLevels(1, activist1Address);

              expect(eraLevels).to.equal(7);
            });

            it("eraLevels must have 4 level to activist2", async () => {
              const eraLevels = await instance.eraLevels(1, activist2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(activist1Address).addLevel(activist1Address, 1, 1)).to.be.revertedWith(
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
            context("when activist1 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);

                await instance.addLevel(activist2Address, 1, 1);
                await instance.addLevel(activist2Address, 1, 1);
                await instance.addLevel(activist2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("must withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(activist1Address, 1);
                const balanceOf = await rcToken.balanceOf(activist1Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });
            });

            context("when activist1 have 6 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 1200000000000000000000000 tokens", async () => {
                await instance.withdraw(activist1Address, 1);
                const balanceOf = await rcToken.balanceOf(activist1Address);

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("shoud withdraw 0 tokens to activist2", async () => {
                await instance.withdraw(activist2Address, 1);
                const balanceOf = await rcToken.balanceOf(activist2Address);

                expect(balanceOf).to.equal("0");
              });
            });

            context("when activist2 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);
                await instance.addLevel(activist1Address, 1, 1);

                await instance.addLevel(activist2Address, 1, 1);
                await instance.addLevel(activist2Address, 1, 1);
                await instance.addLevel(activist2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(activist2Address, 1);
                const balanceOf = await rcToken.balanceOf(activist2Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when dont have withdraw from era 1", () => {
            beforeEach(async () => {
              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist1Address, 1, 1);

              await instance.addLevel(activist2Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);

              await advanceBlock(8);

              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist1Address, 1, 1);
              await instance.addLevel(activist1Address, 1, 1);

              await instance.addLevel(activist2Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);
              await instance.addLevel(activist2Address, 1, 1);
            });

            context("when activist1 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(activist1Address, 1);
                await instance.withdraw(activist1Address, 2);

                await instance.withdraw(activist2Address, 1);
                await instance.withdraw(activist2Address, 2);
              });

              it("activist pool balance must be 27600000000000000000000000", async () => {
                const balance = await instance.balance();

                expect(balance).to.equal(27600000000000000000000000n);
              });

              it("activist1 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await rcToken.balanceOf(activist1Address);

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("activist1 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, activist1Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });

              it("activist1 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, activist1Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });
            });

            context("when activist2 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(activist1Address, 1);
                await instance.withdraw(activist1Address, 2);

                await instance.withdraw(activist2Address, 1);
                await instance.withdraw(activist2Address, 2);
              });

              it("activist2 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await rcToken.balanceOf(activist2Address);

                expect(balanceOf).to.equal(1200000000000000000000000n);
              });

              it("activist2 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, activist2Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });

              it("activist2 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, activist2Address);

                expect(balanceOf).to.equal(600000000000000000000000n);
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expect(instance.withdraw(activist1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(activist1Address).withdraw(activist1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
