const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeveloperPool", () => {
  let instance, regenerationCredit;
  let owner, dev1Address, dev2Address;
  let args = {
    totalDeveloperPoolTokens: "40000000000000000000000000",
    blocksPerEra: 12,
    halving: 12,
  };

  beforeEach(async () => {
    [owner, dev1Address, dev2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    const instanceFactory = await ethers.getContractFactory("DeveloperPool");
    instance = await instanceFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await regenerationCredit.addContractPool(instance.target, args.totalDeveloperPoolTokens);
  });

  context("when deploy contract", () => {
    it("should initial be era equal one", async () => {
      const currentContractEra = await instance.currentContractEra();
      expect(currentContractEra).to.equal(1);
    });
  });

  context("#getEra", () => {
    context("when access fields", () => {
      it("should have fields", async () => {
        const era = await instance.getEra(1);

        expect(era.levels).to.equal(0);
        expect(era.tokens).to.equal(0);
        expect(era.claimsCount).to.equal(0);
      });
    });
  });

  context("when check time to next approve", () => {
    context("when cant approve", () => {
      it("should return integer > zero", async () => {
        let currentEra = 1;
        const nextEraIn = await instance.nextEraIn(currentEra);

        expect(parseInt(nextEraIn)).to.above(0);
      });
    });

    context("when can approve", () => {
      it("should return integer < zero", async () => {
        let currentEra = 1;

        await advanceBlock(args.blocksPerEra);
        const nextEraIn = await instance.nextEraIn(currentEra);

        expect(parseInt(nextEraIn)).to.lessThan(1);
      });
    });
  });

  context("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when developer have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev2Address, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to developer1", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to developer2", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when developers have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address, 1);
            await instance.addLevel(dev1Address, 5);

            await instance.addLevel(dev2Address, 1);
            await instance.addLevel(dev2Address, 1);
            await instance.addLevel(dev2Address, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev2Address, 1);
            });

            it("era 1 must have 11 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 7 level to developer1", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              expect(eraLevels).to.equal(7);
            });

            it("eraLevels must have 4 level to developer2", async () => {
              const eraLevels = await instance.eraLevels(1, dev2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).addLevel(dev1Address, 1)).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  context("when check how much times can approve", () => {
    context("when cant approve", () => {
      it("should return zero times", async () => {
        let currentEra = 1;
        const canWithdrawTimes = await instance.canWithdrawTimes(currentEra);

        expect(canWithdrawTimes).to.equal(0);
      });
    });

    context("when can approve 2 times", () => {
      it(`should return two times`, async () => {
        let currentEra = 1;
        await advanceBlock(args.blocksPerEra * 2 + 2);

        const canWithdrawTimes = await instance.canWithdrawTimes(currentEra);

        const blocksPrecision = await instance.BLOCKS_PRECISION();
        const fixedPoint = parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision);

        expect(Math.ceil(fixedPoint)).to.equal(2);
      });
    });
  });

  describe("#tokensPerEpoch", () => {
    context("when is epoch 1", () => {
      it("must return 20000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(1);

        expect(tokensPerEpoch).to.equal("20000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 10000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(2);

        expect(tokensPerEpoch).to.equal("10000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 5000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(3);

        expect(tokensPerEpoch).to.equal("5000000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 2500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(4);

        expect(tokensPerEpoch).to.equal("2500000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 1250000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(5);

        expect(tokensPerEpoch).to.equal("1250000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 625000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(6);

        expect(tokensPerEpoch).to.equal("625000000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 312500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(7);

        expect(tokensPerEpoch).to.equal("312500000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 156250000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(8);

        expect(tokensPerEpoch).to.equal("156250000000000000000000");
      });
    });

    context("when is epoch 9", () => {
      it("must return 78125000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(9);

        expect(tokensPerEpoch).to.equal("78125000000000000000000");
      });
    });

    context("when is epoch 10", () => {
      it("must return 39062500000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(10);

        expect(tokensPerEpoch).to.equal("39062500000000000000000");
      });
    });

    context("when is epoch 15", () => {
      it("must return 1220703125000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(15);

        expect(tokensPerEpoch).to.equal("1220703125000000000000");
      });
    });

    context("when is epoch 20", () => {
      it("must return 38146972656250000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(20);

        expect(tokensPerEpoch).to.equal("38146972656250000000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 1666666666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(1, args.halving);

        expect(tokensPerEra).to.equal("1666666666666666666666666");
      });
    });

    context("when is epoch 2", () => {
      it("must return 833333333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(2, args.halving);

        expect(tokensPerEra).to.equal("833333333333333333333333");
      });
    });

    context("when is epoch 3", () => {
      it("must return 416666666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(3, args.halving);

        expect(tokensPerEra).to.equal("416666666666666666666666");
      });
    });

    context("when is epoch 4", () => {
      it("must return 208333333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(4, args.halving);

        expect(tokensPerEra).to.equal("208333333333333333333333");
      });
    });

    context("when is epoch 5", () => {
      it("must return 104166666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(5, args.halving);

        expect(tokensPerEra).to.equal("104166666666666666666666");
      });
    });

    context("when is epoch 6", () => {
      it("must return 52083333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(6, args.halving);

        expect(tokensPerEra).to.equal("52083333333333333333333");
      });
    });

    context("when is epoch 7", () => {
      it("must return 26041666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(7, args.halving);

        expect(tokensPerEra).to.equal("26041666666666666666666");
      });
    });

    context("when is epoch 8", () => {
      it("must return 13020833333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(8, args.halving);

        expect(tokensPerEra).to.equal("13020833333333333333333");
      });
    });

    context("when is epoch 9", () => {
      it("must return 6510416666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(9, args.halving);

        expect(tokensPerEra).to.equal("6510416666666666666666");
      });
    });

    context("when is epoch 10", () => {
      it("must return 3255208333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(10, args.halving);

        expect(tokensPerEra).to.equal("3255208333333333333333");
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when is epoch 1", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when dev1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);

                  await advanceBlock(args.blocksPerEra);
                });

                it("must withdraw 833333333333333333333333 tokens", async () => {
                  await instance.withdraw(dev1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("must update get era", async () => {
                  await instance.withdraw(dev1Address, 1);

                  const era = await instance.getEra(1);

                  expect(era.claimsCount).to.equal(1);
                  expect(era.tokens).to.equal(833333333333333333333333n);
                  expect(era.levels).to.equal(6);
                });
              });

              context("when dev1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await advanceBlock(args.blocksPerEra);
                });

                it("shoud withdraw 1666666666666666666666666 tokens", async () => {
                  await instance.withdraw(dev1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("shoud withdraw 0 tokens to dev2", async () => {
                  await instance.withdraw(dev2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal("0");
                });
              });

              context("when dev2 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);

                  await advanceBlock(args.blocksPerEra);
                });

                it("shoud withdraw 833333333333333333333333 tokens", async () => {
                  await instance.withdraw(dev2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);

                await advanceBlock(8);

                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
              });

              context("when dev1 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(dev1Address, 1);
                  await instance.withdraw(dev1Address, 2);

                  await instance.withdraw(dev2Address, 1);
                  await instance.withdraw(dev2Address, 2);
                });

                it("dev pool balance must be 36666666666666666666666668", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(36666666666666666666666668n);
                });

                it("dev1 balance must be 1666666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("dev1 balance in era 1 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("dev1 balance in era 2 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("must update eras", async () => {
                  const era = await instance.getEra(2);

                  expect(era.claimsCount).to.equal(2);
                  expect(era.tokens).to.equal(1666666666666666666666666n);
                  expect(era.levels).to.equal(6);
                });
              });

              context("when dev2 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(dev1Address, 1);
                  await instance.withdraw(dev1Address, 2);

                  await instance.withdraw(dev2Address, 1);
                  await instance.withdraw(dev2Address, 2);
                });

                it("dev2 balance must be 1666666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("dev2 balance in era 1 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("dev2 balance in era 2 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });
            });
          });
        });

        context("when is epoch 1", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when dev1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("must withdraw 833333333333333333333333 tokens", async () => {
                  await instance.withdraw(dev1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });

              context("when dev1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("shoud withdraw 1666666666666666666666666 tokens", async () => {
                  await instance.withdraw(dev1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("shoud withdraw 0 tokens to dev2", async () => {
                  await instance.withdraw(dev2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal("0");
                });
              });

              context("when dev2 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);
                  await instance.addLevel(dev1Address, 1);

                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);
                  await instance.addLevel(dev2Address, 1);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("shoud withdraw 833333333333333333333333 tokens", async () => {
                  await instance.withdraw(dev2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);

                await advanceBlock(8);

                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);

                await advanceBlock(args.blocksPerEra * args.halving);
              });

              context("when dev1 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(dev1Address, 1);
                  await instance.withdraw(dev1Address, 2);

                  await instance.withdraw(dev2Address, 1);
                  await instance.withdraw(dev2Address, 2);
                });

                it("dev pool balance must be 36666666666666666666666668", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(36666666666666666666666668n);
                });

                it("dev1 balance must be 1666666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(dev1Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("dev1 balance in era 1 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("dev1 balance in era 2 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, dev1Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });

              context("when dev2 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(dev1Address, 1);
                  await instance.withdraw(dev1Address, 2);

                  await instance.withdraw(dev2Address, 1);
                  await instance.withdraw(dev2Address, 2);
                });

                it("dev2 balance must be 1666666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(dev2Address);

                  expect(balanceOf).to.equal(1666666666666666666666666n);
                });

                it("dev2 balance in era 1 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });

                it("dev2 balance in era 2 must be 833333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, dev2Address);

                  expect(balanceOf).to.equal(833333333333333333333333n);
                });
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expect(instance.withdraw(dev1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).withdraw(dev1Address, 1)).to.be.revertedWith("Not allowed caller");
      });
    });
  });
});
