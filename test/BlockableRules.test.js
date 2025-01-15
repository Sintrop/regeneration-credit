const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");

describe("BlockableRules", () => {
  let instance;
  let blocksPrecision;
  let owner, user1Address, user2Address;

  const params = {
    blocksPerEra: 10,
    halving: 12,
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address] = await ethers.getSigners();

    const blockableContractFactory = await ethers.getContractFactory("BlockableRules");

    instance = await blockableContractFactory.deploy(params.blocksPerEra, params.halving);
  });

  describe("#currentContractEra", () => {
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

  describe("#currentEpoch", () => {
    context("when is era 1", () => {
      it("return currentEpoch equal 1", async () => {
        const currentEpoch = await instance.currentEpoch();

        expect(currentEpoch).to.equal(1);
      });
    });

    context("when is era 6", () => {
      beforeEach(async () => {
        await advanceBlock(5 * params.blocksPerEra);
      });

      it("return currentEpoch equal 1", async () => {
        const currentEpoch = await instance.currentEpoch();

        expect(currentEpoch).to.equal(1);
      });
    });

    context("when is era 15", () => {
      beforeEach(async () => {
        await advanceBlock(14 * params.blocksPerEra);
      });

      it("return currentEpoch equal 1", async () => {
        const currentEpoch = await instance.currentEpoch();

        expect(currentEpoch).to.equal(2);
      });
    });
  });

  describe("#canWithdrawTimes", () => {
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
          const canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          expect(canWithdrawTimes).to.equal(0);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 5", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 5;

        it("should can aprove zero times", async () => {
          const canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          expect(canWithdrawTimes).to.equal(0);
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
          let canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);

          canWithdrawTimes = Math.ceil(parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision));

          expect(canWithdrawTimes).to.equal(1);
        });
      });

      context("with currentContractEra = 5 and currentUserEra = 4", () => {
        beforeEach(async () => {
          await advanceBlock(params.blocksPerEra * 4 + 2);
        });

        const currentUserEra = 4;

        it("should can aprove one times", async () => {
          let canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          canWithdrawTimes = Math.ceil(parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision));
          expect(canWithdrawTimes).to.equal(1);
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
          let canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          canWithdrawTimes = Math.ceil(parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision));
          expect(canWithdrawTimes).to.equal(2);
        });
      });

      context("with currentContractEra = 10 and currentUserEra = 8", () => {
        beforeEach(async () => {
          await advanceBlock(9 * params.blocksPerEra + 2);
        });

        const currentUserEra = 8;

        it("should can aprove 2 times", async () => {
          let canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          canWithdrawTimes = Math.ceil(parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision));
          expect(canWithdrawTimes).to.equal(2);
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
          let canWithdrawTimes = await instance.canWithdrawTimes(currentUserEra);
          canWithdrawTimes = Math.ceil(parseInt(canWithdrawTimes) / 10 ** parseInt(blocksPrecision));
          expect(canWithdrawTimes).to.equal(5);
        });
      });
    });
  });

  describe("#nextEraIn", () => {
    context("when user can approve", () => {
      beforeEach(async () => {
        await advanceBlock(2 * params.blocksPerEra);
      });

      const currentUserEra = 1;

      it("should return negative blocks number", async () => {
        const nextEraIn = await instance.nextEraIn(currentUserEra);
        expect(parseInt(nextEraIn)).to.lessThan(0);
      });
    });

    context("when user can't approve", () => {
      const currentUserEra = 1;

      it("should return positive blocks number", async () => {
        const nextEraIn = await instance.nextEraIn(currentUserEra);
        expect(parseInt(nextEraIn)).to.above(0);
      });
    });
  });

  describe("#canWithdraw", () => {
    context("when currentUserEra is less than currentContractEra and currentUserEra don't have passed eraMax", () => {
      beforeEach(async () => {
        await advanceBlock(5 * params.blocksPerEra);
      });

      const currentUserEra = 1;

      it("should return true", async () => {
        const canWithdraw = await instance.canWithdraw(currentUserEra);
        expect(canWithdraw).to.equal(true);
      });
    });

    context("when currentUserEra is equal currentContractEra", () => {
      const currentUserEra = 1;

      it("should return false", async () => {
        const canWithdraw = await instance.canWithdraw(currentUserEra);
        expect(canWithdraw).to.equal(false);
      });
    });
  });
});
