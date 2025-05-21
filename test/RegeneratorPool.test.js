const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RegeneratorPool", () => {
  let instance;
  let regenerationCredit;
  let owner, regenerator1Address, regenerator2Address;

  const args = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    [owner, regenerator1Address, regenerator2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    const instanceFactory = await ethers.getContractFactory("RegeneratorPool");
    instance = await instanceFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await regenerationCredit.addContractPool(instance.target, args.totalTokens);
  });

  describe("#tokensPerEpoch", () => {
    context("when is epoch 1", () => {
      it("must return 375000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(1);

        expect(tokensPerEpoch).to.equal("375000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 187500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(2);

        expect(tokensPerEpoch).to.equal("187500000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 93750000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(3);

        expect(tokensPerEpoch).to.equal("93750000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 46875000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(4);

        expect(tokensPerEpoch).to.equal("46875000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 23437500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(5);

        expect(tokensPerEpoch).to.equal("23437500000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 11718750000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(6);

        expect(tokensPerEpoch).to.equal("11718750000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 5859375000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(7);

        expect(tokensPerEpoch).to.equal("5859375000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 2929687500000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(8);

        expect(tokensPerEpoch).to.equal("2929687500000000000000000");
      });
    });

    context("when is epoch 9", () => {
      it("must return 1464843750000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(9);

        expect(tokensPerEpoch).to.equal("1464843750000000000000000");
      });
    });

    context("when is epoch 10", () => {
      it("must return 732421875000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(10);

        expect(tokensPerEpoch).to.equal("732421875000000000000000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 31250000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(1, args.halving);

        expect(tokensPerEra).to.equal("31250000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 15625000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(2, args.halving);

        expect(tokensPerEra).to.equal("15625000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 7812500000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(3, args.halving);

        expect(tokensPerEra).to.equal("7812500000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 3906250000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(4, args.halving);

        expect(tokensPerEra).to.equal("3906250000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 1953125000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(5, args.halving);

        expect(tokensPerEra).to.equal("1953125000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 976562500000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(6, args.halving);

        expect(tokensPerEra).to.equal("976562500000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 488281250000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(7, args.halving);

        expect(tokensPerEra).to.equal("488281250000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 244140625000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(8, args.halving);

        expect(tokensPerEra).to.equal("244140625000000000000000");
      });
    });

    context("when is epoch 9", () => {
      it("must return 122070312500000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(9, args.halving);

        expect(tokensPerEra).to.equal("122070312500000000000000");
      });
    });

    context("when is epoch 10", () => {
      it("must return 61035156250000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(10, args.halving);

        expect(tokensPerEra).to.equal("61035156250000000000000");
      });
    });

    context("when is epoch 15", () => {
      it("must return 22888183593750000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(15);

        expect(tokensPerEpoch).to.equal("22888183593750000000000");
      });
    });

    context("when is epoch 20", () => {
      it("must return 715255737304687500000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(20);

        expect(tokensPerEpoch).to.equal("715255737304687500000");
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when can approve", () => {
        context("when is epoch 1", () => {
          context("when totalScores is 0", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);
            });

            it("balanceOf must be 0", async () => {
              await instance.withdraw(regenerator1Address, 1);
              const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

              expect(balanceOf).to.equal(0);
            });
          });

          context("when totalScores is 80", () => {
            context("when regenerator1 have 80 regenerationScore", () => {
              beforeEach(async () => {
                await instance.addLevel(regenerator1Address, 80);
                await advanceBlock(args.blocksPerEra);
              });

              it("must withdraw 31250000000000000000000000 of tokens", async () => {
                await instance.withdraw(regenerator1Address, 1);
                const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

                expect(balanceOf).to.equal(31250000000000000000000000n);
              });

              it("total locked must be 750000000000000000000000000 - 31250000000000000000000000 = ", async () => {
                await instance.withdraw(regenerator1Address, 1);
                const totalLocked = await regenerationCredit.totalLocked();

                expect(totalLocked).to.equal(718750000000000000000000000n);
              });
            });
          });

          context("when totalScores is 125", () => {
            beforeEach(async () => {
              await instance.addLevel(regenerator1Address, 80);
              await instance.addLevel(regenerator2Address, 45);
              await advanceBlock(args.blocksPerEra);
            });

            context("when regenerator1 have 80 isaScore", () => {
              it("must withdraw 20000000000000000000000000 of tokens", async () => {
                await instance.withdraw(regenerator1Address, 1);
                const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

                expect(balanceOf).to.equal(20000000000000000000000000n);
              });
            });

            context("when regenerator2 have 45 isaScore", () => {
              it("must withdraw 11250000000000000000000000 tokens", async () => {
                await instance.withdraw(regenerator2Address, 1);
                const balanceOf = await regenerationCredit.balanceOf(regenerator2Address);

                expect(balanceOf).to.equal(11250000000000000000000000n);
              });
            });
          });
        });

        context("when is epoch 2", () => {
          context("when regenerator is in era 1 yet", () => {
            context("when totalScores is 0", () => {
              beforeEach(async () => {
                await advanceBlock(args.blocksPerEra);
              });

              it("balanceOf must be 0", async () => {
                await instance.withdraw(regenerator1Address, 1);
                const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

                expect(balanceOf).to.equal(0);
              });
            });

            context("when totalScores is 80", () => {
              context("when regenerator1 have 80 regenerationScore", () => {
                beforeEach(async () => {
                  await instance.addLevel(regenerator1Address, 80);
                  await advanceBlock(args.blocksPerEra * args.halving);
                });

                it("must withdraw 31250000000000000000000000 of tokens", async () => {
                  await instance.withdraw(regenerator1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

                  expect(balanceOf).to.equal(31250000000000000000000000n);
                });

                it("total locked must be 750000000000000000000000000 - 31250000000000000000000000", async () => {
                  await instance.withdraw(regenerator1Address, 1);
                  const totalLocked = await regenerationCredit.totalLocked();

                  expect(totalLocked).to.equal(718750000000000000000000000n);
                });
              });
            });

            context("when totalScores is 125", () => {
              beforeEach(async () => {
                await instance.addLevel(regenerator1Address, 80);
                await instance.addLevel(regenerator2Address, 45);
                await advanceBlock(args.blocksPerEra * args.halving);
              });

              context("when regenerator1 have 80 isaScore", () => {
                it("must withdraw 20000000000000000000000000 of tokens", async () => {
                  await instance.withdraw(regenerator1Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(regenerator1Address);

                  expect(balanceOf).to.equal(20000000000000000000000000n);
                });
              });

              context("when regenerator2 have 45 isaScore", () => {
                it("must withdraw 11250000000000000000000000 tokens", async () => {
                  await instance.withdraw(regenerator2Address, 1);
                  const balanceOf = await regenerationCredit.balanceOf(regenerator2Address);

                  expect(balanceOf).to.equal(11250000000000000000000000n);
                });
              });
            });
          });
        });
      });

      context("when can't approve", () => {
        it("must return error message", async () => {
          await expect(instance.withdraw(regenerator1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with not allowed caller", () => {
      it("must return error message", async () => {
        await expect(instance.connect(regenerator1Address).withdraw(regenerator1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when regenerator have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(regenerator1Address, 1);
              await instance.addLevel(regenerator2Address, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to regenerator1", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to regenerator2", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator2Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when regenerators have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(regenerator1Address, 1);
            await instance.addLevel(regenerator1Address, 80);

            await instance.addLevel(regenerator2Address, 1);
            await instance.addLevel(regenerator2Address, 1);
            await instance.addLevel(regenerator2Address, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(regenerator1Address, 1);
              await instance.addLevel(regenerator2Address, 1);
            });

            it("era 1 must have 7 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(86);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 82 level to regenerator1", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator1Address);

              expect(eraLevels).to.equal(82);
            });

            it("eraLevels must have 4 level to regenerator2", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });

      context("when add level in era 2", () => {
        context("when regenerators have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(regenerator1Address, 80);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);

              await instance.addLevel(regenerator1Address, 20);
              await instance.addLevel(regenerator1Address, 20);
            });

            it("era 1 must have 80 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(80);
            });

            it("era 2 must have 40 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(40);
            });

            it("eraLevels must have 80 level to regenerator1", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator1Address);

              expect(eraLevels).to.equal(80);
            });

            it("eraLevels must have 4 level to regenerator2", async () => {
              const eraLevels = await instance.eraLevels(1, regenerator2Address);

              expect(eraLevels).to.equal(0);
            });
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(regenerator1Address).addLevel(regenerator1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
