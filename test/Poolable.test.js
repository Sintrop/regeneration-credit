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

  describe("#tokensPerEpoch", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 360000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(1);

          expect(tokensPerEpoch).to.equal(360000000000000000000000000n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 180000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(2);

          expect(tokensPerEpoch).to.equal(180000000000000000000000000n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 90000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(3);

          expect(tokensPerEpoch).to.equal(90000000000000000000000000n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 45000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(4);

          expect(tokensPerEpoch).to.equal(45000000000000000000000000n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 22500000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(5);

          expect(tokensPerEpoch).to.equal(22500000000000000000000000n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 11250000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(6);

          expect(tokensPerEpoch).to.equal(11250000000000000000000000n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 5625000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(7);

          expect(tokensPerEpoch).to.equal(5625000000000000000000000n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 2812500000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(8);

          expect(tokensPerEpoch).to.equal(2812500000000000000000000n);
        });
      });
    });

    context("with invalid epoch", () => {
      context("with current epoch equal 9", () => {
        it("returns 0 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(9);

          expect(tokensPerEpoch).to.equal(0);
        });
      });
    });
  });
});
