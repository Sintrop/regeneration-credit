const ProducerPool = artifacts.require("ProducerPool");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ProducerPool", (accounts) => {
  let instance;
  let sacToken;
  let [owner, producer1Address, producer2Address] = accounts;

  const args = {
    totalTokens: "750000000000000000000000000",
    halving: 8,
    totalEras: 8,
    blocksPerEra: 6,
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
    await sacToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    sacToken = await SacToken.new("150000000000000000000000000000");

    instance = await ProducerPool.new(sacToken.address, args.halving, args.totalEras, args.blocksPerEra);

    await sacToken.addContractPool(instance.address, args.totalTokens);
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
        await advanceBlock(args.blocksPerEra * args.totalEras);
      });

      it("must return 180000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "180000000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 2);
      });

      it("must return 90000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "90000000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 3);
      });

      it("must return 45000000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "45000000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 4);
      });

      it("must return 22500000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "22500000000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 5);
      });

      it("must return 11250000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "11250000000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 6);
      });

      it("must return 5625000000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "5625000000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 7);
      });

      it("must return 2812500000000000000000000", async () => {
        const tokensPerEpoch = await instance.tokensPerEpoch();

        assert.equal(tokensPerEpoch, "2812500000000000000000000");
      });
    });
  });

  describe("#tokensPerEra", () => {
    context("when is epoch 1", () => {
      it("must return 45000000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "45000000000000000000000000");
      });
    });

    context("when is epoch 2", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras);
      });

      it("must return 22500000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "22500000000000000000000000");
      });
    });

    context("when is epoch 3", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 2);
      });

      it("must return 11250000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "11250000000000000000000000");
      });
    });

    context("when is epoch 4", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 3);
      });

      it("must return 5625000000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "5625000000000000000000000");
      });
    });

    context("when is epoch 5", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 4);
      });

      it("must return 2812500000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "2812500000000000000000000");
      });
    });

    context("when is epoch 6", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 5);
      });

      it("must return 1406250000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "1406250000000000000000000");
      });
    });

    context("when is epoch 7", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 6);
      });

      it("must return 703125000000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "703125000000000000000000");
      });
    });

    context("when is epoch 8", () => {
      beforeEach(async () => {
        await advanceBlock(args.blocksPerEra * args.totalEras * 7);
      });

      it("must return 351562500000000000000000", async () => {
        const tokensPerEra = await instance.tokensPerEra();

        assert.equal(tokensPerEra, "351562500000000000000000");
      });
    });
  });

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when can approve", () => {
        beforeEach(async () => {
          await advanceBlock(args.blocksPerEra);
        });

        context("when totalScores is 0", () => {
          it("must return error message", async () => {
            await expectRevert(instance.withdraw(producer1Address, 0, 0, 1), "Don't have tokens to withdraw");
          });
        });

        context("when totalScores is 80", () => {
          context("when producer have 80 isaScore", () => {
            it("must withdraw 45000000000000000000000000 of tokens", async () => {
              await instance.withdraw(producer1Address, 80, 80, 1);
              const balanceOf = await instance.balanceOf(producer1Address);

              assert.equal(balanceOf, 45000000000000000000000000n);
            });
          });

          context("when producer have 0 isaScore", () => {
            it("must return error message", async () => {
              await expectRevert(instance.withdraw(producer1Address, 80, 0, 1), "Don't have tokens to withdraw");
            });
          });

          context("when producer have negative isaScore", () => {
            it("must return error message", async () => {
              await expectRevert(instance.withdraw(producer1Address, 80, -10, 1), "Don't have tokens to withdraw");
            });
          });
        });

        context("when totalScores is 125", () => {
          context("when producer have 80 isaScore", () => {
            it("must withdraw 28800000000000000000000000 of tokens", async () => {
              await instance.withdraw(producer1Address, 125, 80, 1);
              const balanceOf = await instance.balanceOf(producer1Address);

              assert.equal(balanceOf, 28800000000000000000000000n);
            });
          });

          context("when producer have 45 isaScore", () => {
            it("must withdraw 16200000000000000000000000 tokens", async () => {
              await instance.withdraw(producer1Address, 125, 45, 1);
              const balanceOf = await instance.balanceOf(producer1Address);

              assert.equal(balanceOf, 16200000000000000000000000n);
            });
          });
        });
      });

      context("when can't approve", () => {
        it("must return error message", async () => {
          await expectRevert(instance.withdraw(producer1Address, 0, 0, 1), "You can't approve yet");
        });
      });
    });

    context("with not allowed caller", () => {
      it("must return error message", async () => {
        await expectRevert(instance.withdraw(producer1Address, 0, 0, 1), "Not allowed caller");
      });
    });
  });
});
