const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("ValidationPool", () => {
  let instance, regenerationCredit;
  let owner,
    user1Address,
    user2Address,
    denied1Address,
    denied2Address,
    denied3Address,
    denied4Address,
    denied5Address,
    denied6Address,
    denied7Address,
    denied8Address,
    denied9Address,
    denied10Address,
    denied11Address,
    denied12Address;
  let args = {
    totalPoolTokens: "10000000000000000000000000",
    blocksPerEra: 20,
    halving: 12,
  };

  beforeEach(async () => {
    [
      owner,
      user1Address,
      user2Address,
      denied1Address,
      denied2Address,
      denied3Address,
      denied4Address,
      denied5Address,
      denied6Address,
      denied7Address,
      denied8Address,
      denied9Address,
      denied10Address,
      denied11Address,
      denied12Address,
    ] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    const validatorRulesDeployed = await voteRulesDeployed();

    instance = validatorRulesDeployed.validationRules;

    const instanceFactory = await ethers.getContractFactory("ValidationPool");
    instance = await instanceFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    await instance.newAllowedCaller(owner);
    await instance.setContractCall(instance.target);

    await regenerationCredit.addContractPool(instance.target, args.totalPoolTokens);
  });

  describe("#afterDeploy", () => {
    it("should initial be era equal one", async () => {
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
    beforeEach(async () => {
      await instance.setContractCall(owner);
    });

    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when user1 have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(user1Address, denied1Address);
              await instance.addLevel(user1Address, denied2Address);

              await instance.addLevel(user2Address, denied3Address);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(3);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to user1", async () => {
              const eraLevels = await instance.eraLevels(1, user1Address);

              expect(eraLevels).to.equal(2);
            });

            it("eraLevels must have 1 level to user2", async () => {
              const eraLevels = await instance.eraLevels(1, user2Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when users have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(user1Address, denied1Address);
            await instance.addLevel(user1Address, denied2Address);

            await instance.addLevel(user2Address, denied3Address);
            await instance.addLevel(user2Address, denied4Address);
            await instance.addLevel(user2Address, denied5Address);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(user1Address, denied6Address);
              await instance.addLevel(user2Address, denied7Address);
            });

            it("era 1 must have 7 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(7);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 3 level to user1", async () => {
              const eraLevels = await instance.eraLevels(1, user1Address);

              expect(eraLevels).to.equal(3);
            });

            it("eraLevels must have 4 level to user2", async () => {
              const eraLevels = await instance.eraLevels(1, user2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });

      context("when the same user try be processed twice", () => {
        beforeEach(async () => {
          await instance.addLevel(user1Address, denied1Address);
        });

        it("should returns error message", async () => {
          await expect(instance.addLevel(user1Address, denied1Address)).to.be.revertedWith("User already processed");
        });

        it("should have added the level only once", async () => {
          const era1 = await instance.getEra(1);
          expect(era1.levels).to.equal(1);

          const contr1Levels = await instance.eraLevels(1, user1Address);
          expect(contr1Levels).to.equal(1);
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(user1Address).addLevel(user1Address, denied1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#addPointsLevel", () => {
    beforeEach(async () => {
      await instance.setContractCall(owner);
    });

    context("with an allowed caller", () => {
      it("should add one level to a user in the current era", async () => {
        await instance.addPointsLevel(user1Address);

        const eraLevels = await instance.eraLevels(1, user1Address);
        expect(eraLevels).to.equal(1);

        const era1 = await instance.getEra(1);
        expect(era1.levels).to.equal(1);
      });

      it("should correctly add levels to multiple users", async () => {
        await instance.addPointsLevel(user1Address);
        await instance.addPointsLevel(user2Address);

        const era1 = await instance.getEra(1);
        expect(era1.levels).to.equal(2);

        const user1Levels = await instance.eraLevels(1, user1Address);
        expect(user1Levels).to.equal(1);

        const user2Levels = await instance.eraLevels(1, user2Address);
        expect(user2Levels).to.equal(1);
      });

      it("should allow multiple levels to be added to the same user in the same era", async () => {
        await instance.addPointsLevel(user1Address);
        await instance.addPointsLevel(user1Address);
        await instance.addPointsLevel(user1Address);

        const eraLevels = await instance.eraLevels(1, user1Address);
        expect(eraLevels).to.equal(3);

        const era1 = await instance.getEra(1);
        expect(era1.levels).to.equal(3);
      });

      it("should add levels in the correct era after time has passed", async () => {
        await instance.addPointsLevel(user1Address);

        await advanceBlock(args.blocksPerEra);

        await instance.addPointsLevel(user1Address);

        const userLevelsEra1 = await instance.eraLevels(1, user1Address);
        expect(userLevelsEra1).to.equal(1);

        const userLevelsEra2 = await instance.eraLevels(2, user1Address);
        expect(userLevelsEra2).to.equal(1);

        const era2 = await instance.getEra(2);
        expect(era2.levels).to.equal(1);
      });
    });

    context("without an allowed caller", () => {
      it("should revert the transaction with an error message", async () => {
        await expect(instance.connect(user1Address).addPointsLevel(user1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("canWithdrawTimes", () => {
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
      it("must return 5000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(1);

        expect(tokensPerEpoch).to.equal("5000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 2500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(2);

        expect(tokensPerEpoch).to.equal("2500000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 1250000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(3);

        expect(tokensPerEpoch).to.equal("1250000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 625000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(4);

        expect(tokensPerEpoch).to.equal("625000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 312500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(5);

        expect(tokensPerEpoch).to.equal("312500000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 156250000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(6);

        expect(tokensPerEpoch).to.equal("156250000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 78125000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(7);

        expect(tokensPerEpoch).to.equal("78125000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 39062500000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(8);

        expect(tokensPerEpoch).to.equal("39062500000000000000000");
      });
    });

    context("when is epoch 9", () => {
      it("must return 19531250000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(9);

        expect(tokensPerEpoch).to.equal("19531250000000000000000");
      });
    });

    context("when is epoch 10", () => {
      it("must return 9765625000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(10);

        expect(tokensPerEpoch).to.equal("9765625000000000000000");
      });
    });

    context("when is epoch 15", () => {
      it("must return 305175781250000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(15);

        expect(tokensPerEpoch).to.equal("305175781250000000000");
      });
    });

    context("when is epoch 20", () => {
      it("must return 9536743164062500000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(20);

        expect(tokensPerEpoch).to.equal("9536743164062500000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 416666666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(1, args.halving);

        expect(tokensPerEra).to.equal("416666666666666666666666");
      });
    });

    context("when is epoch 2", () => {
      it("must return 208333333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(2, args.halving);

        expect(tokensPerEra).to.equal("208333333333333333333333");
      });
    });

    context("when is epoch 3", () => {
      it("must return 104166666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(3, args.halving);

        expect(tokensPerEra).to.equal("104166666666666666666666");
      });
    });

    context("when is epoch 4", () => {
      it("must return 52083333333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(4, args.halving);

        expect(tokensPerEra).to.equal("52083333333333333333333");
      });
    });

    context("when is epoch 5", () => {
      it("must return 26041666666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(5, args.halving);

        expect(tokensPerEra).to.equal("26041666666666666666666");
      });
    });

    context("when is epoch 6", () => {
      it("must return 13020833333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(6, args.halving);

        expect(tokensPerEra).to.equal("13020833333333333333333");
      });
    });

    context("when is epoch 7", () => {
      it("must return 6510416666666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(7, args.halving);

        expect(tokensPerEra).to.equal("6510416666666666666666");
      });
    });

    context("when is epoch 8", () => {
      it("must return 3255208333333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(8, args.halving);

        expect(tokensPerEra).to.equal("3255208333333333333333");
      });
    });

    context("when is epoch 9", () => {
      it("must return 1627604166666666666666", async () => {
        const tokensPerEra = await instance.tokensPerEra(9, args.halving);

        expect(tokensPerEra).to.equal("1627604166666666666666");
      });
    });

    context("when is epoch 10", () => {
      it("must return 813802083333333333333", async () => {
        const tokensPerEra = await instance.tokensPerEra(10, args.halving);

        expect(tokensPerEra).to.equal("813802083333333333333");
      });
    });
  });

  describe("#withdraw", () => {
    beforeEach(async () => {
      await instance.setContractCall(owner);
    });

    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when is epoch 1", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when user1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(user1Address, denied1Address);
                  await instance.addLevel(user1Address, denied2Address);
                  await instance.addLevel(user1Address, denied3Address);

                  await instance.addLevel(user2Address, denied4Address);
                  await instance.addLevel(user2Address, denied5Address);
                  await instance.addLevel(user2Address, denied6Address);

                  await advanceBlock(args.blocksPerEra);
                });

                it("user1 must withdraw 208333333333333333333333 tokens", async () => {
                  await instance.withdraw(user1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user2 must withdraw 208333333333333333333333 tokens", async () => {
                  await instance.withdraw(user2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("must update get era to user1", async () => {
                  await instance.withdraw(user1Address, 1);

                  const era = await instance.getEra(1);

                  expect(era.claimsCount).to.equal(1);
                  expect(era.tokens).to.equal(208333333333333333333333n);
                  expect(era.levels).to.equal(6);
                });

                it("must update get era to user2", async () => {
                  await instance.withdraw(user2Address, 1);

                  const era = await instance.getEra(1);

                  expect(era.claimsCount).to.equal(1);
                  expect(era.tokens).to.equal(208333333333333333333333n);
                  expect(era.levels).to.equal(6);
                });
              });

              context("when user1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(user1Address, denied1Address);
                  await instance.addLevel(user1Address, denied2Address);
                  await instance.addLevel(user1Address, denied3Address);
                  await instance.addLevel(user1Address, denied4Address);
                  await instance.addLevel(user1Address, denied5Address);
                  await instance.addLevel(user1Address, denied6Address);

                  await advanceBlock(args.blocksPerEra);
                });

                it("shoud withdraw 416666666666666666666666 tokens", async () => {
                  await instance.withdraw(user1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(416666666666666666666666n);
                });

                it("shoud withdraw 0 tokens to user2", async () => {
                  await instance.withdraw(user2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal("0");
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(user1Address, denied1Address);
                await instance.addLevel(user1Address, denied2Address);
                await instance.addLevel(user1Address, denied3Address);

                await instance.addLevel(user2Address, denied4Address);
                await instance.addLevel(user2Address, denied5Address);
                await instance.addLevel(user2Address, denied6Address);

                await advanceBlock(12);

                await instance.addLevel(user1Address, denied7Address);
                await instance.addLevel(user1Address, denied8Address);
                await instance.addLevel(user1Address, denied9Address);

                await instance.addLevel(user2Address, denied10Address);
                await instance.addLevel(user2Address, denied11Address);
                await instance.addLevel(user2Address, denied12Address);
              });

              context("when user1 and user2 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(user1Address, 1);
                  await instance.withdraw(user2Address, 1);

                  await advanceBlock(15);

                  await instance.withdraw(user1Address, 2);
                  await instance.withdraw(user2Address, 2);
                });

                it("user1 pool balance must be 9166666666666666666666668", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(9166666666666666666666668n);
                });

                it("user1 balance must be 416666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(416666666666666666666666n);
                });

                it("user1 balance in era 1 must be 208333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, user1Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user1 balance in era 2 must be 208333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, user1Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user1 must update eras", async () => {
                  const era = await instance.getEra(2);

                  expect(era.claimsCount).to.equal(2);
                  expect(era.tokens).to.equal(416666666666666666666666n);
                  expect(era.levels).to.equal(6);
                });

                it("user2 pool balance must be 9166666666666666666666668", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(9166666666666666666666668n);
                });

                it("user2 balance must be 416666666666666666666666", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal(416666666666666666666666n);
                });

                it("user2 balance in era 1 must be 208333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(1, user2Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user2 balance in era 2 must be 208333333333333333333333", async () => {
                  const balanceOf = await instance.eraTokens(2, user2Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user2 must update eras", async () => {
                  const era = await instance.getEra(2);

                  expect(era.claimsCount).to.equal(2);
                  expect(era.tokens).to.equal(416666666666666666666666n);
                  expect(era.levels).to.equal(6);
                });
              });
            });
          });
        });

        context("when is epoch 2", () => {
          context("when is era 1", () => {
            context("when total of levels in era is 6", () => {
              context("when user1 have 3 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(user1Address, denied1Address);
                  await instance.addLevel(user1Address, denied2Address);
                  await instance.addLevel(user1Address, denied3Address);

                  await instance.addLevel(user2Address, denied4Address);
                  await instance.addLevel(user2Address, denied5Address);
                  await instance.addLevel(user2Address, denied6Address);

                  await advanceBlock(args.blocksPerEra * args.halving);

                  await instance.addLevel(user1Address, denied7Address);

                  await instance.withdraw(user1Address, 1);
                  await instance.withdraw(user2Address, 1);
                });

                it("user1 must withdraw 208333333333333333333333 tokens", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });

                it("user2 must withdraw 208333333333333333333333 tokens", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal(208333333333333333333333n);
                });
              });

              context("when user1 have 6 levels in era 1", () => {
                beforeEach(async () => {
                  await instance.addLevel(user1Address, denied1Address);
                  await instance.addLevel(user1Address, denied2Address);
                  await instance.addLevel(user1Address, denied3Address);
                  await instance.addLevel(user1Address, denied4Address);
                  await instance.addLevel(user1Address, denied5Address);
                  await instance.addLevel(user1Address, denied6Address);

                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("shoud withdraw 416666666666666666666666 tokens", async () => {
                  await instance.withdraw(user1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(416666666666666666666666n);
                });

                it("shoud withdraw 0 tokens to dev2", async () => {
                  await instance.withdraw(user2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal("0");
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when dont have withdraw from era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(user1Address, denied1Address);
                await instance.addLevel(user1Address, denied2Address);
                await instance.addLevel(user1Address, denied3Address);

                await instance.addLevel(user2Address, denied4Address);
                await instance.addLevel(user2Address, denied5Address);
                await instance.addLevel(user2Address, denied6Address);

                await advanceBlock(8);
                await instance.addLevel(user1Address, denied7Address);
                await instance.addLevel(user1Address, denied8Address);
                await instance.addLevel(user1Address, denied9Address);

                await instance.addLevel(user2Address, denied10Address);
                await instance.addLevel(user2Address, denied11Address);
                await instance.addLevel(user2Address, denied12Address);

                await advanceBlock(args.blocksPerEra * args.halving);
              });

              context("when user1 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(user1Address, 1);
                  await instance.withdraw(user1Address, 2);

                  await instance.withdraw(user2Address, 1);
                  await instance.withdraw(user2Address, 2);
                });

                it("dev pool balance must be 9166666666666666666666670", async () => {
                  const balance = await regenerationCredit.balanceOf(instance.target);

                  expect(balance).to.equal(9166666666666666666666670n);
                });

                it("user1 balance must be 404761904761904761904760", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user1Address);

                  expect(balanceOf).to.equal(404761904761904761904760n);
                });

                it("user1 balance in era 1 must be 238095238095238095238094", async () => {
                  const balanceOf = await instance.eraTokens(1, user1Address);

                  expect(balanceOf).to.equal(238095238095238095238094n);
                });

                it("user1 balance in era 2 must be 166666666666666666666666", async () => {
                  const balanceOf = await instance.eraTokens(2, user1Address);

                  expect(balanceOf).to.equal(166666666666666666666666n);
                });
              });

              context("when user2 withdraw from era 1 and era 2", () => {
                beforeEach(async () => {
                  await instance.withdraw(user1Address, 1);
                  await instance.withdraw(user1Address, 2);

                  await instance.withdraw(user2Address, 1);
                  await instance.withdraw(user2Address, 2);
                });

                it("user2 balance must be 428571428571428571428570", async () => {
                  const balanceOf = await regenerationCredit.balanceOf(user2Address);

                  expect(balanceOf).to.equal(428571428571428571428570n);
                });

                it("user2 balance in era 1 must be 178571428571428571428571", async () => {
                  const balanceOf = await instance.eraTokens(1, user2Address);

                  expect(balanceOf).to.equal(178571428571428571428571n);
                });

                it("user2 balance in era 2 must be 249999999999999999999999", async () => {
                  const balanceOf = await instance.eraTokens(2, user2Address);

                  expect(balanceOf).to.equal(249999999999999999999999n);
                });
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expect(instance.withdraw(user1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(user1Address).withdraw(user1Address, 1)).to.be.revertedWith("Not allowed caller");
      });
    });
  });
});
