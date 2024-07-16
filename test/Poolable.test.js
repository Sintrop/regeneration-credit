const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");

describe("Poolable", () => {
  let instance;

  const params = {
    halving: 12,
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
  };

  beforeEach(async () => {
    const poolableContractFactory = await ethers.getContractFactory("Poolable");

    instance = await poolableContractFactory.deploy(params.tokensPerEpochs);
  });

  describe("#tokensPerEra", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 30000000000000000000000000n tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(1, params.halving);

          expect(tokensPerEra).to.equal(30000000000000000000000000n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 15000000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(2, params.halving);

          expect(tokensPerEra).to.equal(15000000000000000000000000n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 7500000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(3, params.halving);

          expect(tokensPerEra).to.equal(7500000000000000000000000n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 3750000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(4, params.halving);

          expect(tokensPerEra).to.equal(3750000000000000000000000n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 1875000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(5, params.halving);

          expect(tokensPerEra).to.equal(1875000000000000000000000n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 937500000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(6, params.halving);

          expect(tokensPerEra).to.equal(937500000000000000000000n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 468750000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(7, params.halving);

          expect(tokensPerEra).to.equal(468750000000000000000000n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 234375000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(8, params.halving);

          expect(tokensPerEra).to.equal(234375000000000000000000n);
        });
      });
    });

    context("with invalid epoch", () => {
      context("with current epoch equal 9", () => {
        it("returns 0 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(9, params.halving);

          expect(tokensPerEra).to.equal(0);
        });
      });
    });
  });
});
