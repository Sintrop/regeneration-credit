const Blockable = artifacts.require("Blockable");

contract("Blockable", (accounts) => {
  let instance;
  let blocksPrecision;
  let [owner, user1Address, user2Address] = accounts;

  const params = {
    blocksPerEra: 10,
    eraMax: 12,
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

  beforeEach(async () => {
    instance = await Blockable.new(params.blocksPerEra, params.eraMax);
  });

  context("when deploy", () => {
    it("should have correct blocksPerEra", async () => {
      const blocksPerEra = await instance.blocksPerEra();

      assert.equal(blocksPerEra, params.blocksPerEra);
    });

    it("should have correct eraMax", async () => {
      const eraMax = await instance.eraMax();

      assert.equal(eraMax, params.eraMax);
    });

    it("should have deployedAt state", async () => {
      const deployedAt = await instance.deployedAt();

      expect(parseInt(deployedAt)).to.be.greaterThan(0);
    });
  });

  context("when call currentContractEra", () => {
    context("when don't have passed eras", () => {
      it("should return that be in era 1", async () => {
        const currentContractEra = await instance.currentContractEra();

        assert.equal(currentContractEra, 1);
      });
    });

    context("when have passed 1x the blocksPerEra", () => {
      beforeEach(async () => {
        await advanceBlock(params.blocksPerEra);
      });

      it("should return that be in era 2", async () => {
        const currentContractEra = await instance.currentContractEra();
        assert.equal(currentContractEra, 2);
      });
    });

    context("when have passed 5x the blocksPerEra", () => {
      beforeEach(async () => {
        await advanceBlock(5 * params.blocksPerEra);
      });

      it("should return that be in era 6", async () => {
        const currentContractEra = await instance.currentContractEra();
        assert.equal(currentContractEra, 6);
      });
    });
  });

  context("when call canApproveTimes", () => {
    beforeEach(async () => {
      blocksPrecision = await instance.BLOCKS_PRECISION();
    });

    context("when currentContractEra is equal currentUserEra", () => {
      context("with currentContractEra = 1 and currentUserEra = 1", () => {
        beforeEach(async () => {
          await advanceBlock(2);
        });

        it("should can aprove zero times", async () => {
          const currentUserEra = 1;
          const canApproveTimes = await instance.canApproveTimes(currentUserEra);
          assert.equal(canApproveTimes, 0);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 5", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 5;

        it("should can aprove zero times", async () => {
          const canApproveTimes = await instance.canApproveTimes(currentUserEra);
          assert.equal(canApproveTimes, 0);
        });
      });
    });

    context("when currentContractEra is bigger in one than currentUserEra", () => {
      context("with currentContractEra = 2 and currentUserEra = 1", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra + 2);
        });

        const currentUserEra = 1;

        it("should can aprove one times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(canApproveTimes / 10 ** blocksPrecision);
          assert.equal(canApproveTimes, 1);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 4", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 4;

        it("should can aprove one times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(canApproveTimes / 10 ** blocksPrecision);
          assert.equal(canApproveTimes, 1);
        });
      });
    });

    context("when currentContractEra is bigger in two than currentUserEra", () => {
      context("with currentContractEra = 3 and currentUserEra = 1", () => {
        beforeEach(async () => {
          await advanceBlock(2 * params.blocksPerEra + 2);
        });

        const currentUserEra = 1;

        it("should can aprove 2 times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(canApproveTimes / 10 ** blocksPrecision);
          assert.equal(canApproveTimes, 2);
        });
      });

      context("with currentContractEra = 10 and currentUserEra = 8", () => {
        beforeEach(async () => {
          await advanceBlock(9 * params.blocksPerEra + 2);
        });

        const currentUserEra = 8;

        it("should can aprove 2 times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(canApproveTimes / 10 ** blocksPrecision);
          assert.equal(canApproveTimes, 2);
        });
      });
    });

    context("when currentContractEra is bigger in five than currentUserEra", () => {
      context("with currentContractEra = 6 and currentUserEra = 1", () => {
        beforeEach(async () => {
          await advanceBlock(5 * params.blocksPerEra + 2);
        });

        const currentUserEra = 1;

        it("should can aprove 4 times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(canApproveTimes / 10 ** blocksPrecision);
          assert.equal(canApproveTimes, 5);
        });
      });
    });
  });

  context("when call nextApproveIn", () => {
    context("when user can approve", () => {
      beforeEach(async () => {
        await advanceBlock(2 * params.blocksPerEra);
      });

      const currentUserEra = 1;

      it("should return negative blocks number", async () => {
        const nextApproveIn = await instance.nextApproveIn(currentUserEra);
        assert.isBelow(parseInt(nextApproveIn), 0);
      });
    });

    context("when user can't approve", () => {
      const currentUserEra = 1;

      it("should return positive blocks number", async () => {
        const nextApproveIn = await instance.nextApproveIn(currentUserEra);
        assert.isAbove(parseInt(nextApproveIn), 0);
      });
    });
  });

  context("when call canApprove", () => {
    context(
      "when currentUserEra is less than currentContractEra and currentUserEra don't have passed eraMax",
      () => {
        beforeEach(async () => {
          await advanceBlock(5 * params.blocksPerEra);
        });

        const currentUserEra = 1;

        it("should return true", async () => {
          const canApprove = await instance.canApprove(currentUserEra);
          assert.equal(canApprove, true);
        });
      }
    );

    context(
      "when currentUserEra is less than currentContractEra and currentUserEra have passed eraMax",
      () => {
        beforeEach(async () => {
          await advanceBlock(20 * params.blocksPerEra);
        });

        const currentUserEra = params.eraMax + 1;

        it("should return false", async () => {
          const canApprove = await instance.canApprove(currentUserEra);
          assert.equal(canApprove, false);
        });
      }
    );

    context("when currentUserEra is equal currentContractEra", () => {
      const currentUserEra = 1;

      it("should return false", async () => {
        const canApprove = await instance.canApprove(currentUserEra);
        assert.equal(canApprove, false);
      });
    });
  });
});
