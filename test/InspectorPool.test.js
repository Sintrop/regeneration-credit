const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InspectorPool", (accounts) => {
  let instance, regenerationCredit;
  let owner, inspector1Address, inspector2Address;

  const args = {
    totalInspectorPoolTokens: "230000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const eventId1 = ethers.toBeHex(1, 32);
  const eventId2 = ethers.toBeHex(2, 32);
  const eventId3 = ethers.toBeHex(3, 32);
  const eventId4 = ethers.toBeHex(4, 32);
  const eventId5 = ethers.toBeHex(5, 32);
  const eventId6 = ethers.toBeHex(6, 32);
  const eventId7 = ethers.toBeHex(7, 32);
  const eventId8 = ethers.toBeHex(8, 32);
  const eventId9 = ethers.toBeHex(9, 32);
  const eventId10 = ethers.toBeHex(10, 32);
  const eventId11 = ethers.toBeHex(11, 32);
  const eventId12 = ethers.toBeHex(12, 32);

  beforeEach(async () => {
    [owner, inspector1Address, inspector2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    const instanceFactory = await ethers.getContractFactory("InspectorPool");
    instance = await instanceFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    await instance.newAllowedCaller(owner);
    await instance.setContractCall(owner);

    await regenerationCredit.addContractPool(instance.target, args.totalInspectorPoolTokens);
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
        expect(era.claimsCount).to.equal(0);
      });
    });
  });

  describe("#nextEraIn", () => {
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

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when inspector have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, eventId1);
              await instance.addLevel(inspector2Address, 1, eventId2);
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
            await instance.addLevel(inspector1Address, 1, eventId1);
            await instance.addLevel(inspector1Address, 1, eventId2);

            await instance.addLevel(inspector2Address, 1, eventId3);
            await instance.addLevel(inspector2Address, 1, eventId4);
            await instance.addLevel(inspector2Address, 1, eventId5);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, eventId6);
              await instance.addLevel(inspector2Address, 1, eventId7);
            });

            it("era 1 must have 7 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(7);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 3 level to inspector1", async () => {
              const eraLevels = await instance.eraLevels(1, inspector1Address);

              expect(eraLevels).to.equal(3);
            });

            it("eraLevels must have 4 level to inspector2", async () => {
              const eraLevels = await instance.eraLevels(1, inspector2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });

      context("when the same resource ID is processed twice", () => {
        // For this test, we'll use a simple number for the event/resource ID.
        const duplicateResourceId = 1;

        beforeEach(async () => {
          // First, we make the successful call with the resource ID.
          await instance.connect(owner).addLevel(inspector1Address, 1, duplicateResourceId);
        });

        it("should revert the second transaction with the same resource ID", async () => {
          // Now, we attempt to call `addLevel` again with the EXACT same resource ID.
          // We expect this transaction to be reverted by our security check.
          await expect(instance.connect(owner).addLevel(inspector1Address, 1, duplicateResourceId)).to.be.revertedWith(
            "Event already processed"
          );
        });

        it("should have added the level only once", async () => {
          // This sanity check ensures the first call worked and the second did not.
          const era1 = await instance.getEra(1);
          expect(era1.levels).to.equal(1);

          const contr1Levels = await instance.eraLevels(1, inspector1Address);
          expect(contr1Levels).to.equal(1);
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(inspector1Address).addLevel(inspector1Address, 1, eventId1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#canWithdrawTimes", () => {
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
      it("must return 115000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(1);

        expect(tokensPerEpoch).to.equal("115000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 57500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(2);

        expect(tokensPerEpoch).to.equal("57500000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 28750000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(3);

        expect(tokensPerEpoch).to.equal("28750000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 14375000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(4);

        expect(tokensPerEpoch).to.equal("14375000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 7187500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(5);

        expect(tokensPerEpoch).to.equal("7187500000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 3593750000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(6);

        expect(tokensPerEpoch).to.equal("3593750000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 1796875000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(7);

        expect(tokensPerEpoch).to.equal("1796875000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 898437500000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(8);

        expect(tokensPerEpoch).to.equal("898437500000000000000000");
      });
    });

    context("when is epoch 9", () => {
      it("must return 449218750000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(9);

        expect(tokensPerEpoch).to.equal("449218750000000000000000");
      });
    });

    context("when is epoch 10", () => {
      it("must return 224609375000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(10);

        expect(tokensPerEpoch).to.equal("224609375000000000000000");
      });
    });

    context("when is epoch 15", () => {
      it("must return 7019042968750000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(15);

        expect(tokensPerEpoch).to.equal("7019042968750000000000");
      });
    });

    context("when is epoch 20", () => {
      it("must return 219345092773437500000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(20);

        expect(tokensPerEpoch).to.equal("219345092773437500000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 9583333333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(1, args.halving);

        expect(tokensPerEra).to.equal("9583333333333333333333333");
      });
    });

    context("when is epoch 2", () => {
      it("must return 4791666666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(2, args.halving);

        expect(tokensPerEra).to.equal("4791666666666666666666666");
      });
    });

    context("when is epoch 3", () => {
      it("must return 2395833333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(3, args.halving);

        expect(tokensPerEra).to.equal("2395833333333333333333333");
      });
    });

    context("when is epoch 4", () => {
      it("must return 1197916666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(4, args.halving);

        expect(tokensPerEra).to.equal("1197916666666666666666666");
      });
    });

    context("when is epoch 5", () => {
      it("must return 598958333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(5, args.halving);

        expect(tokensPerEra).to.equal("598958333333333333333333");
      });
    });

    context("when is epoch 6", () => {
      it("must return 299479166666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(6, args.halving);

        expect(tokensPerEra).to.equal("299479166666666666666666");
      });
    });

    context("when is epoch 7", () => {
      it("must return 149739583333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(7, args.halving);

        expect(tokensPerEra).to.equal("149739583333333333333333");
      });
    });

    context("when is epoch 8", () => {
      it("must return 74869791666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(8, args.halving);

        expect(tokensPerEra).to.equal("74869791666666666666666");
      });
    });

    context("when is epoch 9", () => {
      it("must return 37434895833333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(9, args.halving);

        expect(tokensPerEra).to.equal("37434895833333333333333");
      });
    });

    context("when is epoch 10", () => {
      it("must return 18717447916666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(10, args.halving);

        expect(tokensPerEra).to.equal("18717447916666666666666");
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when is epoch 1", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when inspector1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);

                  await instance.addLevel(inspector2Address, 1, eventId4);
                  await instance.addLevel(inspector2Address, 1, eventId5);
                  await instance.addLevel(inspector2Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra);
                });

                it("must withdraw 4791666666666666666666666 tokens", async () => {
                  await instance.withdraw(inspector1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });

              context("when inspector1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);
                  await instance.addLevel(inspector1Address, 1, eventId4);
                  await instance.addLevel(inspector1Address, 1, eventId5);
                  await instance.addLevel(inspector1Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra);
                });

                it("shoud withdraw 9583333333333333333333333 tokens", async () => {
                  await instance.withdraw(inspector1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(9583333333333333333333333n);
                });

                it("shoud withdraw 0 tokens to inspector2", async () => {
                  await instance.withdraw(inspector2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal("0");
                });
              });

              context("when inspector2 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);

                  await instance.addLevel(inspector2Address, 1, eventId4);
                  await instance.addLevel(inspector2Address, 1, eventId5);
                  await instance.addLevel(inspector2Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra);
                });

                it("shoud withdraw 4791666666666666666666666 tokens", async () => {
                  await instance.withdraw(inspector2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, eventId1);
                await instance.addLevel(inspector1Address, 1, eventId2);
                await instance.addLevel(inspector1Address, 1, eventId3);

                await instance.addLevel(inspector2Address, 1, eventId4);
                await instance.addLevel(inspector2Address, 1, eventId5);
                await instance.addLevel(inspector2Address, 1, eventId6);

                await advanceBlock(8);

                await instance.addLevel(inspector1Address, 1, eventId7);
                await instance.addLevel(inspector1Address, 1, eventId8);
                await instance.addLevel(inspector1Address, 1, eventId9);

                await instance.addLevel(inspector2Address, 1, eventId10);
                await instance.addLevel(inspector2Address, 1, eventId11);
                await instance.addLevel(inspector2Address, 1, eventId12);
              });

              context("when inspector1 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(inspector1Address, 1);
                  await instance.withdraw(inspector1Address, 2);

                  await instance.withdraw(inspector2Address, 1);
                  await instance.withdraw(inspector2Address, 2);
                });

                it("inspector pool balance must be 210833333333333333333333336", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(210833333333333333333333336n);
                });

                it("inspector1 balance must be 9583333333333333333333332", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(9583333333333333333333332n);
                });

                it("inspector1 balance in era 1 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(1, inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });

                it("inspector1 balance in era 2 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(2, inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });

                it("must update eras", async () => {
                  const era = await instance.getEra(2);

                  expect(era.claimsCount).to.equal(2);
                  expect(era.tokens).to.equal(9583333333333333333333332n);
                  expect(era.levels).to.equal(6);
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
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal(9583333333333333333333332n);
                });

                it("inspector2 balance in era 1 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(1, inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });

                it("inspector2 balance in era 2 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(2, inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });
            });
          });
        });

        context("when is epoch 2", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when inspector1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);

                  await instance.addLevel(inspector2Address, 1, eventId4);
                  await instance.addLevel(inspector2Address, 1, eventId5);
                  await instance.addLevel(inspector2Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("must withdraw 4791666666666666666666666 tokens", async () => {
                  await instance.withdraw(inspector1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });

              context("when inspector1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);
                  await instance.addLevel(inspector1Address, 1, eventId4);
                  await instance.addLevel(inspector1Address, 1, eventId5);
                  await instance.addLevel(inspector1Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("shoud withdraw 9583333333333333333333333 tokens", async () => {
                  await instance.withdraw(inspector1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(9583333333333333333333333n);
                });

                it("shoud withdraw 0 tokens to inspector2", async () => {
                  await instance.withdraw(inspector2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal("0");
                });
              });

              context("when inspector2 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(inspector1Address, 1, eventId1);
                  await instance.addLevel(inspector1Address, 1, eventId2);
                  await instance.addLevel(inspector1Address, 1, eventId3);

                  await instance.addLevel(inspector2Address, 1, eventId4);
                  await instance.addLevel(inspector2Address, 1, eventId5);
                  await instance.addLevel(inspector2Address, 1, eventId6);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("shoud withdraw 4791666666666666666666666 tokens", async () => {
                  await instance.withdraw(inspector2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, eventId1);
                await instance.addLevel(inspector1Address, 1, eventId2);
                await instance.addLevel(inspector1Address, 1, eventId3);

                await instance.addLevel(inspector2Address, 1, eventId4);
                await instance.addLevel(inspector2Address, 1, eventId5);
                await instance.addLevel(inspector2Address, 1, eventId6);

                await advanceBlock(8);

                await instance.addLevel(inspector1Address, 1, eventId7);
                await instance.addLevel(inspector1Address, 1, eventId8);
                await instance.addLevel(inspector1Address, 1, eventId9);

                await instance.addLevel(inspector2Address, 1, eventId10);
                await instance.addLevel(inspector2Address, 1, eventId11);
                await instance.addLevel(inspector2Address, 1, eventId12);

                await advanceBlock(args.blocksPerEra * args.halving);
              });

              context("when inspector1 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(inspector1Address, 1);
                  await instance.withdraw(inspector1Address, 2);

                  await instance.withdraw(inspector2Address, 1);
                  await instance.withdraw(inspector2Address, 2);
                });

                it("inspector pool balance must be 210833333333333333333333336", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(210833333333333333333333336n);
                });

                it("inspector1 balance must be 1200000000000000000000000", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(inspector1Address);

                  expect(balanceOf).to.equal(9583333333333333333333332n);
                });

                it("inspector1 balance in era 1 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(1, inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });

                it("inspector1 balance in era 2 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(2, inspector1Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
              });

              context("when inspector2 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(inspector1Address, 1);
                  await instance.withdraw(inspector1Address, 2);

                  await instance.withdraw(inspector2Address, 1);
                  await instance.withdraw(inspector2Address, 2);
                });

                it("inspector2 balance must be 9583333333333333333333332", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(inspector2Address);

                  expect(balanceOf).to.equal(9583333333333333333333332n);
                });

                it("inspector2 balance in era 1 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(1, inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });

                it("inspector2 balance in era 2 must be 4791666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(2, inspector2Address);

                  expect(balanceOf).to.equal(4791666666666666666666666n);
                });
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

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(inspector1Address).withdraw(inspector1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
