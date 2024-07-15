const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InspectorPool", (accounts) => {
  let instance, rcToken;
  let owner, inspector1Address, inspector2Address;

  const args = {
    totalInspectorPoolTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [owner, inspector1Address, inspector2Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();

    const instanceFactory = await ethers.getContractFactory("InspectorPool");
    instance = await instanceFactory.deploy(rcToken.target, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.target, args.totalInspectorPoolTokens);
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
    it("must return balance of InspectorPool", async () => {
      const balance = await instance.balance();

      expect(balance).to.equal(args.totalInspectorPoolTokens);
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when inspector have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to inspector1", async () => {
              const eraLevels = await instance.eraLevels(1, inspector1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to inspector2", async () => {
              const eraLevels = await instance.eraLevels(1, inspector2Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when inspectors have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(inspector1Address, 1, 1);
            await instance.addLevel(inspector1Address, 1, 5);

            await instance.addLevel(inspector2Address, 1, 1);
            await instance.addLevel(inspector2Address, 1, 1);
            await instance.addLevel(inspector2Address, 1, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            it("era 1 must have 11 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 7 level to inspector1", async () => {
              const eraLevels = await instance.eraLevels(1, inspector1Address);

              expect(eraLevels).to.equal(7);
            });

            it("eraLevels must have 4 level to inspector2", async () => {
              const eraLevels = await instance.eraLevels(1, inspector2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(inspector1Address).addLevel(inspector1Address, 1, 1)).to.be.revertedWith(
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
            context("when inspector1 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("must withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector1Address, 1);
                const balanceOf = await rcToken.balanceOf(inspector1Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });
            });

            context("when inspector1 have 6 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 1200000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector1Address, 1);
                const balanceOf = await rcToken.balanceOf(inspector1Address);

                expect(balanceOf).to.equal(7200000000000000000000000n);
              });

              it("shoud withdraw 0 tokens to inspector2", async () => {
                await instance.withdraw(inspector2Address, 1);
                const balanceOf = await rcToken.balanceOf(inspector2Address);

                expect(balanceOf).to.equal("0");
              });
            });

            context("when inspector2 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector2Address, 1);
                const balanceOf = await rcToken.balanceOf(inspector2Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when dont have withdraw from era 1", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);

              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);

              await advanceBlock(8);

              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);

              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            context("when inspector1 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(inspector1Address, 1);
                await instance.withdraw(inspector1Address, 2);

                await instance.withdraw(inspector2Address, 1);
                await instance.withdraw(inspector2Address, 2);
              });

              it("inspector pool balance must be 27600000000000000000000000", async () => {
                const balance = await instance.balance();

                expect(balance).to.equal(165600000000000000000000000n);
              });

              it("inspector1 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await rcToken.balanceOf(inspector1Address);

                expect(balanceOf).to.equal(7200000000000000000000000n);
              });

              it("inspector1 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, inspector1Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });

              it("inspector1 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, inspector1Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });
            });

            context("when inspector2 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(inspector1Address, 1);
                await instance.withdraw(inspector1Address, 2);

                await instance.withdraw(inspector2Address, 1);
                await instance.withdraw(inspector2Address, 2);
              });

              it("inspector2 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await rcToken.balanceOf(inspector2Address);

                expect(balanceOf).to.equal(7200000000000000000000000n);
              });

              it("inspector2 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, inspector2Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });

              it("inspector2 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, inspector2Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expect(instance.withdraw(inspector1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(inspector1Address).withdraw(inspector1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
