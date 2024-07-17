const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProducerPool", () => {
  let instance;
  let rcToken;
  let owner, producer1Address, producer2Address;

  const args = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await rcToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    [owner, producer1Address, producer2Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();

    const instanceFactory = await ethers.getContractFactory("ProducerPool");
    instance = await instanceFactory.deploy(rcToken.target, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.target, args.totalTokens);
  });

  describe("#tokensPerEpoch", () => {
    context("when is epoch 1", () => {
      it("must return 360000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(1);

        expect(tokensPerEpoch).to.equal("360000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 180000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(2);

        expect(tokensPerEpoch).to.equal("180000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 90000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(3);

        expect(tokensPerEpoch).to.equal("90000000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 45000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(4);

        expect(tokensPerEpoch).to.equal("45000000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 22500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(5);

        expect(tokensPerEpoch).to.equal("22500000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 11250000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(6);

        expect(tokensPerEpoch).to.equal("11250000000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 5625000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(7);

        expect(tokensPerEpoch).to.equal("5625000000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 2812500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch(8);

        expect(tokensPerEpoch).to.equal("2812500000000000000000000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 30000000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(1, args.halving);

        expect(tokensPerEra).to.equal("30000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      it("must return 15000000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(2, args.halving);

        expect(tokensPerEra).to.equal("15000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      it("must return 7500000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(3, args.halving);

        expect(tokensPerEra).to.equal("7500000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      it("must return 3750000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(4, args.halving);

        expect(tokensPerEra).to.equal("3750000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      it("must return 1875000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(5, args.halving);

        expect(tokensPerEra).to.equal("1875000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      it("must return 937500000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(6, args.halving);

        expect(tokensPerEra).to.equal("937500000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      it("must return 468750000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(7, args.halving);

        expect(tokensPerEra).to.equal("468750000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      it("must return 234375000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra(8, args.halving);

        expect(tokensPerEra).to.equal("234375000000000000000000");
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when can approve", () => {
        context("when totalScores is 0", () => {
          beforeEach(async () => {
            await advanceBlock(args.blocksPerEra);
          });

          it("balanceOf must be 0", async () => {
            await instance.withdraw(producer1Address, 1);
            const balanceOf = await rcToken.balanceOf(producer1Address);

            expect(balanceOf).to.equal(0);
          });
        });

        context("when totalScores is 80", () => {
          context("when producer1 have 80 isaScore", () => {
            beforeEach(async () => {
              await instance.addLevel(producer1Address, 80, 80);
              await advanceBlock(args.blocksPerEra);
            });

            it("must withdraw 30000000000000000000000000 of tokens", async () => {
              await instance.withdraw(producer1Address, 1);
              const balanceOf = await rcToken.balanceOf(producer1Address);

              expect(balanceOf).to.equal(30000000000000000000000000n);
            });

            it("total locked must be 750000000000000000000000000 - 30000000000000000000000000 = ", async () => {
              await instance.withdraw(producer1Address, 1);
              const totalLocked = await rcToken.totalLocked();

              expect(totalLocked).to.equal(720000000000000000000000000n);
            });
          });
        });

        context("when totalScores is 125", () => {
          beforeEach(async () => {
            await instance.addLevel(producer1Address, 80, 80);
            await instance.addLevel(producer2Address, 45, 45);
            await advanceBlock(args.blocksPerEra);
          });

          context("when producer1 have 80 isaScore", () => {
            it("must withdraw 19200000000000000000000000 of tokens", async () => {
              await instance.withdraw(producer1Address, 1);
              const balanceOf = await rcToken.balanceOf(producer1Address);

              expect(balanceOf).to.equal(19200000000000000000000000n);
            });
          });

          context("when producer2 have 45 isaScore", () => {
            it("must withdraw 10800000000000000000000000 tokens", async () => {
              await instance.withdraw(producer2Address, 1);
              const balanceOf = await rcToken.balanceOf(producer2Address);

              expect(balanceOf).to.equal(10800000000000000000000000n);
            });
          });
        });
      });

      context("when can't approve", () => {
        it("must return error message", async () => {
          await expect(instance.withdraw(producer1Address, 1)).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with not allowed caller", () => {
      it("must return error message", async () => {
        await expect(instance.connect(producer1Address).withdraw(producer1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when producer have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(producer1Address, 1, 1);
              await instance.addLevel(producer2Address, 1, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 1 level to producer1", async () => {
              const eraLevels = await instance.eraLevels(1, producer1Address);

              expect(eraLevels).to.equal(1);
            });

            it("eraLevels must have 1 level to producer2", async () => {
              const eraLevels = await instance.eraLevels(1, producer2Address);

              expect(eraLevels).to.equal(1);
            });
          });
        });

        context("when producers have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(producer1Address, 1, 1);
            await instance.addLevel(producer1Address, 1, 80);

            await instance.addLevel(producer2Address, 1, 1);
            await instance.addLevel(producer2Address, 1, 1);
            await instance.addLevel(producer2Address, 1, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(producer1Address, 1, 1);
              await instance.addLevel(producer2Address, 1, 1);
            });

            it("era 1 must have 7 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(86);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(0);
            });

            it("eraLevels must have 82 level to producer1", async () => {
              const eraLevels = await instance.eraLevels(1, producer1Address);

              expect(eraLevels).to.equal(82);
            });

            it("eraLevels must have 4 level to producer2", async () => {
              const eraLevels = await instance.eraLevels(1, producer2Address);

              expect(eraLevels).to.equal(4);
            });
          });
        });
      });

      context("when add level in era 2", () => {
        context("when producers have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(producer1Address, 80, 80);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);

              await instance.addLevel(producer1Address, 20, 20);
              await instance.addLevel(producer1Address, 20, 20);
            });

            it("era 1 must have 80 level", async () => {
              const era1 = await instance.getEra(1);

              expect(era1.levels).to.equal(80);
            });

            it("era 2 must have 40 level", async () => {
              const era2 = await instance.getEra(2);

              expect(era2.levels).to.equal(40);
            });

            it("eraLevels must have 80 level to producer1", async () => {
              const eraLevels = await instance.eraLevels(1, producer1Address);

              expect(eraLevels).to.equal(80);
            });

            it("eraLevels must have 4 level to producer2", async () => {
              const eraLevels = await instance.eraLevels(1, producer2Address);

              expect(eraLevels).to.equal(0);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expect(instance.connect(producer1Address).addLevel(producer1Address, 1, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
