const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");

describe("Blockable", () => {
  let instance;
  let blocksPrecision;
  let owner, user1Address, user2Address;

  const params = {
    blocksPerEra: 10,
    tokensPerEpochs: [
      360000000000000000000000000n,
      180000000000000000000000000n,
      90000000000000000000000000n,
      45000000000000000000000000n,
      22500000000000000000000000n,
      11250000000000000000000000n,
      5625000000000000000000000n,
      2812500000000000000000000n,
    ],
    eraMax: 12,
    halving: 12,
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address] = await ethers.getSigners();

    const blockableContractFactory = await ethers.getContractFactory("Blockable");

    instance = await blockableContractFactory.deploy(
      params.blocksPerEra,
      params.tokensPerEpochs,
      params.eraMax,
      params.halving
    );
  });

  context("when call currentContractEra", () => {
    context("when don't have passed eras", () => {
      it("should return that be in era 1", async () => {
        const currentContractEra = await instance.currentContractEra();

        expect(currentContractEra).to.equal(1);
      });
    });

    context("when have passed 1x the blocksPerEra", () => {
      beforeEach(async () => {
        await advanceBlock(params.blocksPerEra);
      });

      it("should return that be in era 2", async () => {
        const currentContractEra = await instance.currentContractEra();
        expect(currentContractEra).to.equal(2);
      });
    });

    context("when have passed 5x the blocksPerEra", () => {
      beforeEach(async () => {
        await advanceBlock(5 * params.blocksPerEra);
      });

      it("should return that be in era 6", async () => {
        const currentContractEra = await instance.currentContractEra();
        expect(currentContractEra).to.equal(6);
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
          expect(canApproveTimes).to.equal(0);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 5", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 5;

        it("should can aprove zero times", async () => {
          const canApproveTimes = await instance.canApproveTimes(currentUserEra);
          expect(canApproveTimes).to.equal(0);
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

          canApproveTimes = Math.ceil(parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision));

          expect(canApproveTimes).to.equal(1);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 4", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 4;

        it("should can aprove one times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision));
          expect(canApproveTimes).to.equal(1);
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
          canApproveTimes = Math.ceil(parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision));
          expect(canApproveTimes).to.equal(2);
        });
      });

      context("with currentContractEra = 10 and currentUserEra = 8", () => {
        beforeEach(async () => {
          await advanceBlock(9 * params.blocksPerEra + 2);
        });

        const currentUserEra = 8;

        it("should can aprove 2 times", async () => {
          let canApproveTimes = await instance.canApproveTimes(currentUserEra);
          canApproveTimes = Math.ceil(parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision));
          expect(canApproveTimes).to.equal(2);
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
          canApproveTimes = Math.ceil(parseInt(canApproveTimes) / 10 ** parseInt(blocksPrecision));
          expect(canApproveTimes).to.equal(5);
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
        expect(parseInt(nextApproveIn)).to.lessThan(0);
      });
    });

    context("when user can't approve", () => {
      const currentUserEra = 1;

      it("should return positive blocks number", async () => {
        const nextApproveIn = await instance.nextApproveIn(currentUserEra);
        expect(parseInt(nextApproveIn)).to.above(0);
      });
    });
  });

  context("when call canApprove", () => {
    context("when currentUserEra is less than currentContractEra and currentUserEra don't have passed eraMax", () => {
      beforeEach(async () => {
        await advanceBlock(5 * params.blocksPerEra);
      });

      const currentUserEra = 1;

      it("should return true", async () => {
        const canApprove = await instance.canApprove(currentUserEra);
        expect(canApprove).to.equal(true);
      });
    });

    context("when currentUserEra is less than currentContractEra and currentUserEra have passed eraMax", () => {
      beforeEach(async () => {
        await advanceBlock(20 * params.blocksPerEra);
      });

      const currentUserEra = params.eraMax + 1;

      it("should return false", async () => {
        const canApprove = await instance.canApprove(currentUserEra);
        expect(canApprove).to.equal(false);
      });
    });

    context("when currentUserEra is equal currentContractEra", () => {
      const currentUserEra = 1;

      it("should return false", async () => {
        const canApprove = await instance.canApprove(currentUserEra);
        expect(canApprove).to.equal(false);
      });
    });
  });
});
