const ProducerPool = artifacts.require("ProducerPool");
const RcToken = artifacts.require("RcToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ProducerPool", (accounts) => {
  let instance;
  let rcToken;
  let [owner, producer1Address, producer2Address] = accounts;

  const args = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  advanceBlock = async (blocksNumber) => {
    for (let i = 0; i < blocksNumber; i++) {
      let promise = new Promise((resolve, reject) => {
        web3.currentProvider.send(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime(),
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            const newBlockHash = web3.eth.getBlock("latest").hash;

            return resolve(newBlockHash);
          }
        );
      });
    }
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await rcToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    rcToken = await RcToken.new("150000000000000000000000000000");

    instance = await ProducerPool.new(rcToken.address, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.address, args.totalTokens);
  });

  describe("#balanceOf", () => {
    beforeEach(async () => {
      await transferTokensTo(producer2Address, "10000000000000000000");
    });

    it("must return the balance of the producer 1", async () => {
      const balanceOf = await instance.balanceOf(producer1Address);
      assert.equal(balanceOf, 0);
    });

    it("must return the balance of the producer 2", async () => {
      const balanceOf = await instance.balanceOf(producer2Address);
      assert.equal(balanceOf, 10000000000000000000n);
    });
  });

  describe("#tokensPerEpoch", () => {
    context("when is epoch 1", () => {
      it("must return 360000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "360000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving);
      });

      it("must return 180000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "180000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 2);
      });

      it("must return 90000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "90000000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 3);
      });

      it("must return 45000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "45000000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 4);
      });

      it("must return 22500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "22500000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 5);
      });

      it("must return 11250000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "11250000000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 6);
      });

      it("must return 5625000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "5625000000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 7);
      });

      it("must return 2812500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "2812500000000000000000000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 30000000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "30000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving);
      });

      it("must return 15000000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "15000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 2);
      });

      it("must return 7500000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "7500000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 3);
      });

      it("must return 3750000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "3750000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 4);
      });

      it("must return 1875000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "1875000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 5);
      });

      it("must return 937500000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "937500000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 6);
      });

      it("must return 468750000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "468750000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.halving * 7);
      });

      it("must return 234375000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "234375000000000000000000");
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
            const balanceOf = await instance.balanceOf(producer1Address);

            assert.equal(balanceOf, 0);
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
              const balanceOf = await instance.balanceOf(producer1Address);

              assert.equal(balanceOf, 30000000000000000000000000n);
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
              const balanceOf = await instance.balanceOf(producer1Address);

              assert.equal(balanceOf, 19200000000000000000000000n);
            });
          });

          context("when producer2 have 45 isaScore", () => {
            it("must withdraw 10800000000000000000000000 tokens", async () => {
              await instance.withdraw(producer2Address, 1);
              const balanceOf = await instance.balanceOf(producer2Address);

              assert.equal(balanceOf, 10800000000000000000000000n);
            });
          });
        });
      });

      context("when can't approve", () => {
        it("must return error message", async () => {
          await expectRevert(instance.withdraw(producer1Address, 1), "You can't approve yet");
        });
      });
    });

    context("with not allowed caller", () => {
      it("must return error message", async () => {
        await expectRevert(instance.withdraw(producer1Address, 1, { from: producer1Address }), "Not allowed caller");
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

              assert.equal(era1.levels, 2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 1 level to producer1", async () => {
              const eraLevels = await instance.eraLevels(1, producer1Address);

              assert.equal(eraLevels, 1);
            });

            it("eraLevels must have 1 level to producer2", async () => {
              const eraLevels = await instance.eraLevels(1, producer2Address);

              assert.equal(eraLevels, 1);
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

              assert.equal(era1.levels, 86);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 82 level to producer1", async () => {
              const eraLevels = await instance.eraLevels(1, producer1Address);

              assert.equal(eraLevels, 82);
            });

            it("eraLevels must have 4 level to producer2", async () => {
              const eraLevels = await instance.eraLevels(1, producer2Address);

              assert.equal(eraLevels, 4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(instance.addLevel(producer1Address, 1, 1, { from: producer1Address }), "Not allowed caller");
      });
    });
  });
});
